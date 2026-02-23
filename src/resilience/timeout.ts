/**
 * Timeout - Enforces max execution time for operations
 */

export class TimeoutError extends Error {
  constructor(public readonly timeoutMs: number) {
    super(`Operation timed out after ${timeoutMs}ms`);
    this.name = 'TimeoutError';
  }
}

// Race operation against timeout
export async function executeWithTimeout<T>(
  fn: () => Promise<T>,
  timeoutMs: number,
  onTimeout?: () => void
): Promise<T> {
  let timerId: ReturnType<typeof setTimeout>;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timerId = setTimeout(() => {
      onTimeout?.();
      reject(new TimeoutError(timeoutMs));
    }, timeoutMs);
  });
  try {
    return await Promise.race([fn(), timeoutPromise]);
  } finally {
    clearTimeout(timerId!);
  }
}

// Create AbortSignal that triggers after timeout
export function createTimeoutSignal(timeoutMs: number): AbortSignal {
  const controller = new AbortController();
  setTimeout(() => controller.abort(), timeoutMs);
  return controller.signal;
}

// Wrap function with timeout behavior
export function withTimeout<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  timeoutMs: number,
  onTimeout?: () => void
): (...args: T) => Promise<R> {
  return (...args: T) => executeWithTimeout(() => fn(...args), timeoutMs, onTimeout);
}
