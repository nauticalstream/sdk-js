/**
 * Circuit breaker utilities for Realtime module
 * Wraps resilience module functions for module-specific breaker management
 */
import { resetCircuitBreaker, getCircuitBreaker } from '../../resilience';
/**
 * Reset the circuit breaker for a specific MQTT broker.
 * Useful after resolving downstream broker issues.
 *
 * The breaker is keyed by the broker URL you passed to `RealtimeClientConfig.brokerUrl`,
 * so you must pass the same URL here.
 *
 * @param brokerUrl - Broker URL (must match the one used in RealtimeClientConfig)
 */
export function resetBreaker(brokerUrl) {
    resetCircuitBreaker(brokerUrl);
}
/**
 * Get circuit breaker metrics for a specific broker.
 *
 * @param brokerUrl - Broker URL (must match the one used in RealtimeClientConfig)
 * @returns Breaker metrics or undefined if no breaker exists for this URL
 */
export function getBreakerMetrics(brokerUrl) {
    const breaker = getCircuitBreaker(brokerUrl);
    if (!breaker) {
        return undefined;
    }
    return breaker.getMetrics();
}
//# sourceMappingURL=circuit-breaker.js.map