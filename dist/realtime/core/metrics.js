"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.circuitBreakerState = exports.publishErrorsByType = exports.retryAttempts = exports.publishAttempts = exports.publishSuccess = exports.publishLatency = void 0;
const api_1 = require("@opentelemetry/api");
const METER_NAME = '@nauticalstream/realtime';
const meter = api_1.metrics.getMeter(METER_NAME, '1.0.0');
/**
 * Publish operation latency in milliseconds
 */
exports.publishLatency = meter.createHistogram('publish.latency.ms', {
    description: 'MQTT publish operation latency in milliseconds',
    unit: 'ms',
});
/**
 * Successful publish count
 */
exports.publishSuccess = meter.createCounter('publish.success.total', {
    description: 'Total successful MQTT publishes',
});
/**
 * Failed publish attempts (before retries)
 */
exports.publishAttempts = meter.createCounter('publish.attempts.total', {
    description: 'Total MQTT publish attempts',
});
/**
 * Retry attempts triggered
 */
exports.retryAttempts = meter.createCounter('retry.attempts.total', {
    description: 'Total retry attempts triggered',
});
/**
 * Publish errors by type
 */
exports.publishErrorsByType = meter.createCounter('publish.errors.total', {
    description: 'Total MQTT publish errors by error type',
});
/**
 * Circuit breaker state transitions
 */
exports.circuitBreakerState = meter.createUpDownCounter('circuit_breaker.state', {
    description: 'Circuit breaker state (1=closed/healthy, 0=open/unhealthy)',
});
//# sourceMappingURL=metrics.js.map