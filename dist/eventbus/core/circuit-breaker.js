"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOrCreateBreaker = getOrCreateBreaker;
exports.isBreakerOpen = isBreakerOpen;
exports.resetBreaker = resetBreaker;
const opossum_1 = __importDefault(require("opossum"));
const metrics_1 = require("./metrics");
const logger_1 = require("../utils/logger");
const DEFAULT_CONFIG = {
    timeout: 5000,
    errorThresholdPercentage: 50,
    resetTimeout: 30000,
};
const breakers = new Map();
function getOrCreateBreaker(serverCluster, logger, config = {}) {
    if (breakers.has(serverCluster)) {
        return breakers.get(serverCluster);
    }
    const effectiveLogger = logger || logger_1.defaultLogger;
    const merged = { ...DEFAULT_CONFIG, ...config };
    const breaker = new opossum_1.default(async (fn) => fn(), {
        timeout: merged.timeout,
        errorThresholdPercentage: merged.errorThresholdPercentage,
        resetTimeout: merged.resetTimeout,
        name: `nats-breaker-${serverCluster}`,
        rollingCountBuckets: 10,
        rollingCountTimeout: 10000,
    });
    breaker.on('open', () => {
        effectiveLogger.error({ server: serverCluster }, 'Circuit breaker OPEN - NATS cluster unhealthy');
        metrics_1.jetstreamCircuitBreakerState.add(-1, { server: serverCluster });
    });
    breaker.on('halfOpen', () => {
        effectiveLogger.warn({ server: serverCluster }, 'Circuit breaker HALF-OPEN - testing NATS recovery');
    });
    breaker.on('close', () => {
        effectiveLogger.info({ server: serverCluster }, 'Circuit breaker CLOSED - NATS recovered');
        metrics_1.jetstreamCircuitBreakerState.add(1, { server: serverCluster });
    });
    metrics_1.jetstreamCircuitBreakerState.add(1, { server: serverCluster });
    breakers.set(serverCluster, breaker);
    return breaker;
}
function isBreakerOpen(serverCluster) {
    const breaker = breakers.get(serverCluster);
    if (!breaker)
        return false;
    return breaker.opened;
}
function resetBreaker(serverCluster) {
    const breaker = breakers.get(serverCluster);
    if (breaker) {
        breaker.close();
    }
}
//# sourceMappingURL=circuit-breaker.js.map