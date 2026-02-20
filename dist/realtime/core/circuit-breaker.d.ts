import CircuitBreaker from 'opossum';
import { Logger } from 'pino';
interface BreakerConfig {
    timeout?: number;
    errorThresholdPercentage?: number;
    resetTimeout?: number;
}
/**
 * Get or create circuit breaker for MQTT broker
 * @param brokerUrl - Unique identifier for broker (hostname or connection string)
 * @param logger - Logger instance (optional, uses default logger if not provided)
 * @param config - Optional circuit breaker config
 */
export declare function getOrCreateBreaker(brokerUrl: string, logger?: Logger, config?: BreakerConfig): CircuitBreaker<any>;
/**
 * Check if circuit breaker is open for a broker
 */
export declare function isBreakerOpen(brokerUrl: string): boolean;
/**
 * Manually reset circuit breaker (for operational use)
 */
export declare function resetBreaker(brokerUrl: string): void;
/**
 * Get metrics for all breakers
 */
export declare function getBreakerMetrics(): Record<string, any>;
export {};
//# sourceMappingURL=circuit-breaker.d.ts.map