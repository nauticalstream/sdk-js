"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.jetstreamCircuitBreakerState = exports.jetstreamPublishErrors = exports.jetstreamRetryAttempts = exports.jetstreamPublishAttempts = exports.jetstreamPublishSuccess = exports.jetstreamPublishLatency = void 0;
const api_1 = require("@opentelemetry/api");
const METER_NAME = '@nauticalstream/eventbus';
const meter = api_1.metrics.getMeter(METER_NAME, '1.0.0');
/**
 * JetStream publish latency in milliseconds
 */
exports.jetstreamPublishLatency = meter.createHistogram('jetstream.publish.latency.ms', {
    description: 'JetStream publish operation latency in milliseconds',
    unit: 'ms',
});
/**
 * Successful JetStream publishes
 */
exports.jetstreamPublishSuccess = meter.createCounter('jetstream.publish.success.total', {
    description: 'Total successful JetStream publishes',
});
/**
 * JetStream publish attempts
 */
exports.jetstreamPublishAttempts = meter.createCounter('jetstream.publish.attempts.total', {
    description: 'Total JetStream publish attempts',
});
/**
 * JetStream retry attempts
 */
exports.jetstreamRetryAttempts = meter.createCounter('jetstream.retry.attempts.total', {
    description: 'Total JetStream retry attempts',
});
/**
 * JetStream publish errors by type
 */
exports.jetstreamPublishErrors = meter.createCounter('jetstream.publish.errors.total', {
    description: 'Total JetStream publish errors by type',
});
/**
 * Circuit breaker state for JetStream
 */
exports.jetstreamCircuitBreakerState = meter.createUpDownCounter('jetstream.circuit_breaker.state', {
    description: 'JetStream circuit breaker state (1=closed, 0=open)',
});
//# sourceMappingURL=metrics.js.map