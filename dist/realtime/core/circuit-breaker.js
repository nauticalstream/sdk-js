import CircuitBreaker from 'opossum';
import { circuitBreakerState } from './metrics';
import { defaultLogger } from '../utils/logger';
const DEFAULT_CONFIG = {
    timeout: 5000,
    errorThresholdPercentage: 50,
    resetTimeout: 30000,
};
const breakers = new Map();
/**
 * Get or create circuit breaker for MQTT broker
 * @param brokerUrl - Unique identifier for broker (hostname or connection string)
 * @param logger - Logger instance (optional, uses default logger if not provided)
 * @param config - Optional circuit breaker config
 */
export function getOrCreateBreaker(brokerUrl, logger, config = {}) {
    const effectiveLogger = logger || defaultLogger;
    if (breakers.has(brokerUrl)) {
        return breakers.get(brokerUrl);
    }
    const merged = { ...DEFAULT_CONFIG, ...config };
    const breaker = new CircuitBreaker(async (fn) => fn(), {
        timeout: merged.timeout,
        errorThresholdPercentage: merged.errorThresholdPercentage,
        resetTimeout: merged.resetTimeout,
        name: `mqtt-breaker-${brokerUrl}`,
        rollingCountBuckets: 10,
        rollingCountTimeout: 10000,
    });
    // State transition handlers
    breaker.on('open', () => {
        effectiveLogger.error({ broker: brokerUrl }, 'Circuit breaker OPEN - broker health check failed');
        circuitBreakerState.add(-1, { broker: brokerUrl });
    });
    breaker.on('halfOpen', () => {
        effectiveLogger.warn({ broker: brokerUrl }, 'Circuit breaker HALF-OPEN - attempting recovery');
    });
    breaker.on('close', () => {
        effectiveLogger.info({ broker: brokerUrl }, 'Circuit breaker CLOSED - broker recovered');
        circuitBreakerState.add(1, { broker: brokerUrl });
    });
    breaker.on('fallback', () => {
        effectiveLogger.error({ broker: brokerUrl }, 'Circuit breaker FALLBACK - returning cached/default response');
    });
    circuitBreakerState.add(1, { broker: brokerUrl }); // Start as closed (1)
    breakers.set(brokerUrl, breaker);
    return breaker;
}
/**
 * Check if circuit breaker is open for a broker
 */
export function isBreakerOpen(brokerUrl) {
    const breaker = breakers.get(brokerUrl);
    if (!breaker)
        return false;
    return breaker.opened;
}
/**
 * Manually reset circuit breaker (for operational use)
 */
export function resetBreaker(brokerUrl) {
    const breaker = breakers.get(brokerUrl);
    if (breaker) {
        breaker.fallback(() => {
            // Reset internal state
        });
        breaker.close();
    }
}
/**
 * Get metrics for all breakers
 */
export function getBreakerMetrics() {
    const metrics = {};
    breakers.forEach((breaker, url) => {
        metrics[url] = {
            isOpen: breaker.opened,
            failureCount: breaker.stats?.fires || 0,
            successCount: breaker.stats?.successes || 0,
        };
    });
    return metrics;
}
//# sourceMappingURL=circuit-breaker.js.map