import { describe, it, expect, vi } from 'vitest';
import { executeWithTimeout, withTimeout, createTimeoutSignal, TimeoutError } from '../timeout';

describe('executeWithTimeout', () => {
  it('resolves with the function result when it completes in time', async () => {
    const result = await executeWithTimeout(() => Promise.resolve(42), 1000);
    expect(result).toBe(42);
  });

  it('rejects with TimeoutError when the function exceeds the limit', async () => {
    const slow = () => new Promise<never>((_resolve, _reject) => setTimeout(_resolve, 500));
    await expect(executeWithTimeout(slow, 20)).rejects.toBeInstanceOf(TimeoutError);
  });

  it('TimeoutError carries the configured timeoutMs value', async () => {
    const slow = () => new Promise<never>((_resolve) => setTimeout(_resolve, 500));
    const err = await executeWithTimeout(slow, 30).catch((e) => e);
    expect(err).toBeInstanceOf(TimeoutError);
    expect((err as TimeoutError).timeoutMs).toBe(30);
  });

  it('calls the onTimeout callback when timing out', async () => {
    const onTimeout = vi.fn();
    const slow = () => new Promise<never>((_r) => setTimeout(_r, 500));
    await executeWithTimeout(slow, 20, onTimeout).catch(() => null);
    expect(onTimeout).toHaveBeenCalledOnce();
  });

  it('does not call onTimeout when the function succeeds', async () => {
    const onTimeout = vi.fn();
    await executeWithTimeout(() => Promise.resolve('ok'), 500, onTimeout);
    expect(onTimeout).not.toHaveBeenCalled();
  });

  it('propagates the original error when the function rejects before timeout', async () => {
    const boom = new Error('intentional');
    await expect(executeWithTimeout(() => Promise.reject(boom), 500)).rejects.toBe(boom);
  });
});

describe('withTimeout', () => {
  it('wraps a function so it resolves normally when fast enough', async () => {
    const fn = async (x: number) => x * 2;
    const wrapped = withTimeout(fn, 500);
    expect(await wrapped(5)).toBe(10);
  });

  it('rejects with TimeoutError for a wrapped slow function', async () => {
    const slow = async (_: number) => new Promise<number>((r) => setTimeout(() => r(0), 500));
    const wrapped = withTimeout(slow, 20);
    await expect(wrapped(1)).rejects.toBeInstanceOf(TimeoutError);
  });
});

describe('createTimeoutSignal', () => {
  it('returns an AbortSignal that fires after the specified duration', async () => {
    const signal = createTimeoutSignal(30);
    expect(signal.aborted).toBe(false);
    await new Promise((r) => setTimeout(r, 60));
    expect(signal.aborted).toBe(true);
  });
});
