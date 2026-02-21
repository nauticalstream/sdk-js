/**
 * Configuration for automatic retry behavior on transient failures
 */
export interface RetryConfig {
  /** Maximum number of retry attempts (total attempts = retries + 1) */
  maxRetries?: number;
  /** Initial delay between attempts in milliseconds */
  initialDelayMs?: number;
  /** Maximum delay between attempts in milliseconds */
  maxDelayMs?: number;
  /** Exponential backoff multiplier */
  backoffFactor?: number;
  /** Maximum time for entire operation including all retries (milliseconds) */
  operationTimeout?: number;
}

/**
 * Default retry configuration: 3 attempts with exponential backoff 100ms → 200ms → 400ms, 5s timeout
 */
export const DEFAULT_RETRY_CONFIG: Required<RetryConfig> = {
  maxRetries: 2,
  initialDelayMs: 100,
  maxDelayMs: 400,
  backoffFactor: 2,
  operationTimeout: 5000,
};

/**
 * Default timeout for request/reply RPC calls in milliseconds
 */
export const DEFAULT_REQUEST_TIMEOUT_MS = 5000;
