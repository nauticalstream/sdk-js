import { metrics } from '@opentelemetry/api';

const METER_NAME = '@nauticalstream/realtime';

const meter = metrics.getMeter(METER_NAME, '1.0.0');

/**
 * Publish operation latency in milliseconds
 */
export const publishLatency = meter.createHistogram('publish.latency.ms', {
  description: 'MQTT publish operation latency in milliseconds',
  unit: 'ms',
});

/**
 * Successful publish count
 */
export const publishSuccess = meter.createCounter('publish.success.total', {
  description: 'Total successful MQTT publishes',
});

/**
 * Failed publish attempts (before retries)
 */
export const publishAttempts = meter.createCounter('publish.attempts.total', {
  description: 'Total MQTT publish attempts',
});

/**
 * Retry attempts triggered
 */
export const retryAttempts = meter.createCounter('retry.attempts.total', {
  description: 'Total retry attempts triggered',
});

/**
 * Publish errors by type
 */
export const publishErrorsByType = meter.createCounter('publish.errors.total', {
  description: 'Total MQTT publish errors by error type',
});

/**
 * Circuit breaker state transitions
 */
export const circuitBreakerState = meter.createUpDownCounter('circuit_breaker.state', {
  description: 'Circuit breaker state (1=closed/healthy, 0=open/unhealthy)',
});
