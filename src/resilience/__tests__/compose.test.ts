import { describe, it, expect, vi, afterEach } from 'vitest';
import type { Counter, Histogram } from '@opentelemetry/api';
import { resilientOperation } from '../compose';
import { shouldRetry } from '../errors';
import { ResilientCircuitBreaker, clearAllCircuitBreakers } from '../circuit-breaker';
import { ServiceUnavailableError } from '../../errors/system/ServiceUnavailableError';
import { NetworkError } from '../../errors/system/NetworkError';
import { ValidationError } from '../../errors/domain/ValidationError';

afterEach(() => {
  clearAllCircuitBreakers();
});

/** Identity classifier — already-typed errors pass through */
const identity = (e: unknown): Error => (e instanceof Error ? e : new Error(String(e)));

/** Minimal retry config that won't slow tests down */
const fastRetry = { maxRetries: 2, initialDelayMs: 1, maxDelayMs: 5, backoffFactor: 1 };

function makeMockMetrics() {
  return {
    latency: { record: vi.fn() } as unknown as Histogram,
    success: { add: vi.fn() } as unknown as Counter,
    errors: { add: vi.fn() } as unknown as Counter,
    retries: { add: vi.fn() } as unknown as Counter,
  };
}

describe('resilientOperation', () => {
  describe('success path', () => {
    it('returns the function result', async () => {
      const result = await resilientOperation(
        () => Promise.resolve('value'),
        { operation: 'test', classifier: identity, shouldRetry }
      );
      expect(result).toBe('value');
    });

    it('records latency and success metrics on success', async () => {
      const metrics = makeMockMetrics();
      await resilientOperation(
        () => Promise.resolve('ok'),
        { operation: 'test', classifier: identity, shouldRetry, metrics, labels: { op: 'test' } }
      );
      expect(metrics.latency.record).toHaveBeenCalledOnce();
      const [latencyMs, labels] = (metrics.latency.record as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(latencyMs).toBeGreaterThanOrEqual(0);
      expect(labels).toMatchObject({ op: 'test' });
      expect(metrics.success.add).toHaveBeenCalledWith(1, { op: 'test' });
      expect(metrics.errors.add).not.toHaveBeenCalled();
    });
  });

  describe('error path', () => {
    it('classifies the error and rethrows it', async () => {
      const original = new ServiceUnavailableError('svc down');
      await expect(
        resilientOperation(() => Promise.reject(original), { operation: 'x', classifier: identity, shouldRetry })
      ).rejects.toBe(original);
    });

    it('records error metrics on failure', async () => {
      const metrics = makeMockMetrics();
      await resilientOperation(
        () => Promise.reject(new ServiceUnavailableError('err')),
        { operation: 'op', classifier: identity, shouldRetry, metrics }
      ).catch(() => null);

      expect(metrics.errors.add).toHaveBeenCalledOnce();
      expect(metrics.success.add).not.toHaveBeenCalled();
    });
  });

  describe('retry layer', () => {
    it('retries a SystemException and succeeds on a later attempt', async () => {
      const fn = vi.fn()
        .mockRejectedValueOnce(new ServiceUnavailableError('glitch'))
        .mockResolvedValue('recovered');

      const result = await resilientOperation(fn, {
        operation: 'retry-test',
        classifier: identity,
        shouldRetry,
        retry: fastRetry,
      });

      expect(result).toBe('recovered');
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('increments retry counter for each retry', async () => {
      const metrics = makeMockMetrics();
      const fn = vi.fn()
        .mockRejectedValueOnce(new NetworkError('temporarily down'))
        .mockRejectedValueOnce(new NetworkError('still down'))
        .mockResolvedValue('up');

      await resilientOperation(fn, {
        operation: 'counts-retries',
        classifier: identity,
        shouldRetry,
        retry: fastRetry,
        metrics,
      });

      expect(metrics.retries.add).toHaveBeenCalledTimes(2);
    });

    it('stops retrying a DomainException and throws immediately', async () => {
      const fn = vi.fn().mockRejectedValue(new ValidationError('bad input'));

      await expect(
        resilientOperation(fn, {
          operation: 'no-retry',
          classifier: identity,
          shouldRetry,
          retry: fastRetry,
        })
      ).rejects.toThrow();

      expect(fn).toHaveBeenCalledOnce();
    });
  });

  describe('timeout layer', () => {
    it('rejects with classified error if fn takes too long', async () => {
      const slow = () => new Promise<string>((r) => setTimeout(() => r('late'), 500));

      await expect(
        resilientOperation(slow, {
          operation: 'timeout-test',
          classifier: identity,
          shouldRetry,
          timeoutMs: 20,
          // No retries so we fail fast
        })
      ).rejects.toThrow();
    });
  });

  describe('circuit breaker layer', () => {
    it('routes execution through the breaker and returns the value', async () => {
      const breaker = new ResilientCircuitBreaker({ failureThreshold: 0.5, timeoutMs: 60_000, volumeThreshold: 5 });

      const result = await resilientOperation(
        () => Promise.resolve('via-breaker'),
        { operation: 'breaker-test', classifier: identity, shouldRetry, breaker }
      );

      expect(result).toBe('via-breaker');
    });

    it('rejects when the circuit is open', async () => {
      const breaker = new ResilientCircuitBreaker({ failureThreshold: 0.5, timeoutMs: 60_000, volumeThreshold: 2 });
      const fail = () => Promise.reject(new ServiceUnavailableError('down'));

      // Trip the breaker
      await breaker.execute(fail).catch(() => null);
      await breaker.execute(fail).catch(() => null);
      expect(breaker.getState()).toBe('OPEN');

      const probe = vi.fn().mockResolvedValue('should not run');
      await expect(
        resilientOperation(probe, { operation: 'open-test', classifier: identity, shouldRetry, breaker })
      ).rejects.toThrow();
      expect(probe).not.toHaveBeenCalled();
    });
  });
});
