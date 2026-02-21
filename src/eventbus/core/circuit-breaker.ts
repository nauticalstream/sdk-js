/**
 * Circuit breaker utilities for EventBus module
 * Wraps resilience module functions for module-specific breaker management
 */

import { resetCircuitBreaker } from '../../resilience';

/**
 * Reset the JetStream publish circuit breaker
 * Useful after resolving downstream NATS issues
 * 
 * @param breakerId - Optional specific breaker ID, defaults to JetStream publish breaker
 */
export function resetBreaker(breakerId?: string): void {
  const id = breakerId || 'jetstream-publish';
  resetCircuitBreaker(id);
}
