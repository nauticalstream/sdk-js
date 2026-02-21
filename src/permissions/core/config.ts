/**
 * Permissions module configuration
 * Re-exports resilience config for backward compatibility
 */

export type { RetryConfig, CircuitBreakerConfig } from '../../resilience';
export { DEFAULT_RETRY_CONFIG, DEFAULT_CIRCUIT_BREAKER_CONFIG } from '../../resilience';

