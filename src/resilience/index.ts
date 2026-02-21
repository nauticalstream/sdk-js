/**
 * Resilience - Battle-tested patterns using p-retry + opossum
 * 
 * - retry: Exponential backoff with p-retry
 * - circuit-breaker: Failure protection with opossum
 * - timeout: Max execution time limits
 * - compose: Combine all primitives with metrics
 * - should-retry: Error classification for retry logic
 */

export {
  retryOperation,
  withRetry,
  AbortError,
  DEFAULT_RETRY_CONFIG,
  type RetryConfig,
} from './retry';

export {
  ResilientCircuitBreaker,
  getOrCreateCircuitBreaker,
  getCircuitBreaker,
  resetCircuitBreaker,
  clearAllCircuitBreakers,
  DEFAULT_CIRCUIT_BREAKER_CONFIG,
  type BreakerState,
  type CircuitBreakerConfig,
  type BreakerMetrics,
} from './circuit-breaker';

export {
  executeWithTimeout,
  createTimeoutSignal,
  withTimeout,
  TimeoutError,
} from './timeout';

export {
  resilientOperation,
  createResilientFunction,
  type ErrorClassifier,
  type ResilienceConfig,
  type ResilienceMetrics,
} from './compose';

export { shouldRetry } from './errors';
