import { describe, it, expect, vi } from 'vitest';
import { retryOperation, withRetry } from '../retry';
import { SystemException } from '../../errors';
import { ServiceUnavailableError } from '../../errors/system/ServiceUnavailableError';
import { ValidationError } from '../../errors/domain/ValidationError';

/** True only for infrastructure (retryable) errors */
const retryIfSystem = (e: Error) => e instanceof SystemException;

describe('retryOperation', () => {
  it('calls fn once and resolves when the first attempt succeeds', async () => {
    const fn = vi.fn().mockResolvedValue('ok');
    const result = await retryOperation(fn, retryIfSystem, { maxRetries: 3, initialDelayMs: 0, maxDelayMs: 0, backoffFactor: 1 });
    expect(result).toBe('ok');
    expect(fn).toHaveBeenCalledOnce();
  });

  it('retries on a SystemException and resolves when a later attempt succeeds', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new ServiceUnavailableError('network glitch'))
      .mockRejectedValueOnce(new ServiceUnavailableError('network glitch'))
      .mockResolvedValue('recovered');

    const result = await retryOperation(fn, retryIfSystem, { maxRetries: 3, initialDelayMs: 1, maxDelayMs: 5, backoffFactor: 1 });
    expect(result).toBe('recovered');
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('throws after exhausting all retries', async () => {
    const err = new ServiceUnavailableError('down');
    const fn = vi.fn().mockRejectedValue(err);
    await expect(
      retryOperation(fn, retryIfSystem, { maxRetries: 2, initialDelayMs: 1, maxDelayMs: 5, backoffFactor: 1 })
    ).rejects.toThrow();
    // Called 1 initial + 2 retries = 3 total
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('does NOT retry a DomainException (non-retryable error)', async () => {
    const fn = vi.fn().mockRejectedValue(new ValidationError('bad input'));
    await expect(
      retryOperation(fn, retryIfSystem, { maxRetries: 3, initialDelayMs: 1, maxDelayMs: 5, backoffFactor: 1 })
    ).rejects.toThrow();
    // fn should only be called once — no retries
    expect(fn).toHaveBeenCalledOnce();
  });

  it('calls the onRetry callback with attempt number on each retry', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new ServiceUnavailableError('err1'))
      .mockRejectedValueOnce(new ServiceUnavailableError('err2'))
      .mockResolvedValue('done');
    const onRetry = vi.fn();

    await retryOperation(fn, retryIfSystem, { maxRetries: 3, initialDelayMs: 1, maxDelayMs: 5, backoffFactor: 1 }, onRetry);

    expect(onRetry).toHaveBeenCalledTimes(2);
    expect(onRetry.mock.calls[0][0]).toBe(1); // attemptNumber starts at 1
    expect(onRetry.mock.calls[1][0]).toBe(2);
  });
});

describe('withRetry', () => {
  it('wraps a function adding retry behavior', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new ServiceUnavailableError('transient'))
      .mockResolvedValue(99);

    const wrapped = withRetry(fn, retryIfSystem, { maxRetries: 2, initialDelayMs: 1, maxDelayMs: 5, backoffFactor: 1 });
    const result = await wrapped();
    expect(result).toBe(99);
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('passes arguments through to the original function', async () => {
    const fn = vi.fn().mockResolvedValue('result');
    const wrapped = withRetry(fn, retryIfSystem);
    await wrapped('a', 'b');
    expect(fn).toHaveBeenCalledWith('a', 'b');
  });
});
