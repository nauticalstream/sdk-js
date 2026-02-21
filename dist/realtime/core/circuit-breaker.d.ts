/**
 * Circuit breaker utilities for Realtime module
 * Wraps resilience module functions for module-specific breaker management
 */
import { type BreakerMetrics } from '../../resilience';
/**
 * Reset the MQTT publish circuit breaker
 * Useful after resolving downstream broker issues
 *
 * @param brokerUrl - Optional specific broker URL, defaults to MQTT publish breaker
 */
export declare function resetBreaker(brokerUrl?: string): void;
/**
 * Get circuit breaker metrics for a specific broker
 *
 * @param brokerUrl - Broker URL to check, defaults to MQTT publish breaker
 * @returns Breaker metrics or undefined if breaker doesn't exist
 */
export declare function getBreakerMetrics(brokerUrl?: string): BreakerMetrics | undefined;
//# sourceMappingURL=circuit-breaker.d.ts.map