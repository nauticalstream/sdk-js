/**
 * Circuit breaker utilities for EventBus module
 * Wraps resilience module functions for module-specific breaker management
 */
/**
 * Reset the JetStream publish circuit breaker
 * Useful after resolving downstream NATS issues
 *
 * @param breakerId - Optional specific breaker ID, defaults to JetStream publish breaker
 */
export declare function resetBreaker(breakerId?: string): void;
//# sourceMappingURL=circuit-breaker.d.ts.map