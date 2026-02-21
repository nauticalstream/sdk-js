import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  ResilientCircuitBreaker,
  getOrCreateCircuitBreaker,
  getCircuitBreaker,
  resetCircuitBreaker,
  clearAllCircuitBreakers,
} from '../circuit-breaker';

afterEach(() => {
  clearAllCircuitBreakers();
});

/** Breaker with a small volume threshold so tests don't need many requests */
function makeBreaker(volumeThreshold = 2) {
  return new ResilientCircuitBreaker({
    failureThreshold: 0.5,
    timeoutMs: 60_000, // long — no auto-recovery during tests
    volumeThreshold,
  });
}

describe('ResilientCircuitBreaker', () => {
  describe('initial state', () => {
    it('starts CLOSED', () => {
      expect(makeBreaker().getState()).toBe('CLOSED');
    });

    it('isOpen() returns false initially', () => {
      expect(makeBreaker().isOpen()).toBe(false);
    });

    it('initial metrics show zero counters', () => {
      const m = makeBreaker().getMetrics();
      expect(m.failures).toBe(0);
      expect(m.successes).toBe(0);
      expect(m.totalRequests).toBe(0);
      expect(m.failureRate).toBe(0);
    });
  });

  describe('execute', () => {
    it('returns the resolved value from the inner function', async () => {
      const breaker = makeBreaker();
      const result = await breaker.execute(() => Promise.resolve('hello'));
      expect(result).toBe('hello');
    });

    it('propagates rejections through to the caller', async () => {
      const breaker = makeBreaker();
      const boom = new Error('boom');
      await expect(breaker.execute(() => Promise.reject(boom))).rejects.toBe(boom);
    });

    it('increments success metrics on success', async () => {
      const breaker = makeBreaker();
      await breaker.execute(() => Promise.resolve('ok'));
      expect(breaker.getMetrics().successes).toBe(1);
    });

    it('increments failure metrics on rejection', async () => {
      const breaker = makeBreaker();
      await breaker.execute(() => Promise.reject(new Error('fail'))).catch(() => null);
      expect(breaker.getMetrics().failures).toBe(1);
    });
  });

  describe('tripping open', () => {
    it('transitions to OPEN after threshold failures', async () => {
      const breaker = makeBreaker(/* volumeThreshold */ 2);
      const fail = () => Promise.reject(new Error('down'));

      await breaker.execute(fail).catch(() => null);
      await breaker.execute(fail).catch(() => null);

      expect(breaker.getState()).toBe('OPEN');
      expect(breaker.isOpen()).toBe(true);
    });

    it('rejects immediately without calling fn when OPEN', async () => {
      const breaker = makeBreaker(2);
      const fail = () => Promise.reject(new Error('down'));

      await breaker.execute(fail).catch(() => null);
      await breaker.execute(fail).catch(() => null);

      const probe = vi.fn().mockResolvedValue('should not run');
      await expect(breaker.execute(probe)).rejects.toThrow();
      expect(probe).not.toHaveBeenCalled();
    });

    it('calculates correct failure rate', async () => {
      const breaker = makeBreaker(4);
      const ok = () => Promise.resolve('ok');
      const fail = () => Promise.reject(new Error('fail'));

      await breaker.execute(ok).catch(() => null);
      await breaker.execute(ok).catch(() => null);
      await breaker.execute(fail).catch(() => null);
      await breaker.execute(fail).catch(() => null);

      const m = breaker.getMetrics();
      expect(m.successes).toBe(2);
      expect(m.failures).toBe(2);
      expect(m.failureRate).toBe(0.5);
    });
  });

  describe('reset', () => {
    it('returns to CLOSED after calling reset()', async () => {
      const breaker = makeBreaker(2);
      const fail = () => Promise.reject(new Error('down'));

      await breaker.execute(fail).catch(() => null);
      await breaker.execute(fail).catch(() => null);
      expect(breaker.getState()).toBe('OPEN');

      breaker.reset();
      expect(breaker.getState()).toBe('CLOSED');
    });

    it('can execute successfully after reset', async () => {
      const breaker = makeBreaker(2);
      const fail = () => Promise.reject(new Error('down'));

      await breaker.execute(fail).catch(() => null);
      await breaker.execute(fail).catch(() => null);
      breaker.reset();

      const result = await breaker.execute(() => Promise.resolve('back'));
      expect(result).toBe('back');
    });
  });
});

describe('circuit breaker registry', () => {
  it('getOrCreateCircuitBreaker creates and caches by name', () => {
    const a = getOrCreateCircuitBreaker('svc-a');
    const b = getOrCreateCircuitBreaker('svc-a');
    expect(a).toBe(b);
  });

  it('returns different instances for different names', () => {
    const a = getOrCreateCircuitBreaker('svc-x');
    const b = getOrCreateCircuitBreaker('svc-y');
    expect(a).not.toBe(b);
  });

  it('getCircuitBreaker returns undefined for unknown name', () => {
    expect(getCircuitBreaker('does-not-exist')).toBeUndefined();
  });

  it('getCircuitBreaker returns the registered instance', () => {
    const created = getOrCreateCircuitBreaker('lookup-test');
    expect(getCircuitBreaker('lookup-test')).toBe(created);
  });

  it('resetCircuitBreaker resets the named breaker state', async () => {
    const breaker = getOrCreateCircuitBreaker('reset-test', { failureThreshold: 0.5, timeoutMs: 60_000, volumeThreshold: 2 });
    const fail = () => Promise.reject(new Error('down'));

    await breaker.execute(fail).catch(() => null);
    await breaker.execute(fail).catch(() => null);
    expect(breaker.getState()).toBe('OPEN');

    resetCircuitBreaker('reset-test');
    expect(breaker.getState()).toBe('CLOSED');
  });

  it('clearAllCircuitBreakers empties the registry', () => {
    getOrCreateCircuitBreaker('will-be-gone');
    clearAllCircuitBreakers();
    expect(getCircuitBreaker('will-be-gone')).toBeUndefined();
  });
});
