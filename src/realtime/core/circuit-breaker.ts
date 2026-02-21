/**
 * Circuit breaker utilities for Realtime module
 * Wraps resilience module functions for module-specific breaker management
 */

import { resetCircuitBreaker, getCircuitBreaker, type BreakerMetrics } from '../../resilience';

/**
 * Reset the MQTT publish circuit breaker
 * Useful after resolving downstream broker issues
 * 
 * @param brokerUrl - Optional specific broker URL, defaults to MQTT publish breaker
 */
export function resetBreaker(brokerUrl?: string): void {
  const id = brokerUrl || 'mqtt-publish';
  resetCircuitBreaker(id);
}

/**
 * Get circuit breaker metrics for a specific broker
 * 
 * @param brokerUrl - Broker URL to check, defaults to MQTT publish breaker
 * @returns Breaker metrics or undefined if breaker doesn't exist
 */
export function getBreakerMetrics(brokerUrl?: string): BreakerMetrics | undefined {
  const id = brokerUrl || 'mqtt-publish';
  const breaker = getCircuitBreaker(id);
  
  if (!breaker) {
    return undefined;
  }

  return breaker.getMetrics();
}
