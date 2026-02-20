"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOrCreateBreaker = getOrCreateBreaker;
exports.isBreakerOpen = isBreakerOpen;
exports.resetBreaker = resetBreaker;
exports.getBreakerMetrics = getBreakerMetrics;
const opossum_1 = __importDefault(require("opossum"));
const metrics_1 = require("./metrics");
const logger_1 = require("../utils/logger");
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
function getOrCreateBreaker(brokerUrl, logger, config = {}) {
    const effectiveLogger = logger || logger_1.defaultLogger;
    if (breakers.has(brokerUrl)) {
        return breakers.get(brokerUrl);
    }
    const merged = { ...DEFAULT_CONFIG, ...config };
    const breaker = new opossum_1.default(async (fn) => fn(), {
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
        metrics_1.circuitBreakerState.add(-1, { broker: brokerUrl });
    });
    breaker.on('halfOpen', () => {
        effectiveLogger.warn({ broker: brokerUrl }, 'Circuit breaker HALF-OPEN - attempting recovery');
    });
    breaker.on('close', () => {
        effectiveLogger.info({ broker: brokerUrl }, 'Circuit breaker CLOSED - broker recovered');
        metrics_1.circuitBreakerState.add(1, { broker: brokerUrl });
    });
    breaker.on('fallback', () => {
        effectiveLogger.error({ broker: brokerUrl }, 'Circuit breaker FALLBACK - returning cached/default response');
    });
    metrics_1.circuitBreakerState.add(1, { broker: brokerUrl }); // Start as closed (1)
    breakers.set(brokerUrl, breaker);
    return breaker;
}
/**
 * Check if circuit breaker is open for a broker
 */
function isBreakerOpen(brokerUrl) {
    const breaker = breakers.get(brokerUrl);
    if (!breaker)
        return false;
    return breaker.opened;
}
/**
 * Manually reset circuit breaker (for operational use)
 */
function resetBreaker(brokerUrl) {
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
function getBreakerMetrics() {
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