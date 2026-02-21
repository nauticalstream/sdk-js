/**
 * Retry - Exponential backoff using p-retry
 * Use AbortError to skip retry on specific errors
 */

import pRetry, { type Options as PRetryOptions, AbortError } from 'p-retry';

export interface RetryConfig {
  maxRetries: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffFactor: number;
  /** Maximum time for entire operation including all retries (milliseconds) */
  operationTimeout?: number;
}

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelayMs: 100,
  maxDelayMs: 400,
  backoffFactor: 2,
  operationTimeout: 5000,
};

/** Context shape supplied by p-retry v7 to onFailedAttempt */
interface FailedAttemptContext {
  error: Error;
  attemptNumber: number;
  retriesLeft: number;
  retriesConsumed: number;
}

// Map config to p-retry format
function toPRetryOptions(
  config: RetryConfig,
  shouldRetry: (error: Error) => boolean,
  onRetry?: (attempt: number, error: Error) => void
): PRetryOptions {
  return {
    retries: config.maxRetries,
    factor: config.backoffFactor,
    minTimeout: config.initialDelayMs,
    maxTimeout: config.maxDelayMs,
    randomize: true,
    ...(config.operationTimeout && { signal: AbortSignal.timeout(config.operationTimeout) }),
    onFailedAttempt: (ctx: FailedAttemptContext) => {
      if (!shouldRetry(ctx.error)) throw new AbortError(ctx.error);
      onRetry?.(ctx.attemptNumber, ctx.error);
    },
  };
}

// Execute operation with retry logic
export async function retryOperation<T>(
  fn: () => Promise<T>,
  shouldRetry: (error: Error) => boolean,
  config: RetryConfig = DEFAULT_RETRY_CONFIG,
  onRetry?: (attempt: number, error: Error) => void
): Promise<T> {
  return pRetry(fn, toPRetryOptions(config, shouldRetry, onRetry));
}

// Wrap function with retry behavior
export function withRetry<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  shouldRetry: (error: Error) => boolean,
  config: RetryConfig = DEFAULT_RETRY_CONFIG,
  onRetry?: (attempt: number, error: Error) => void
): (...args: T) => Promise<R> {
  return (...args: T) => retryOperation(() => fn(...args), shouldRetry, config, onRetry);
}

export { AbortError };
