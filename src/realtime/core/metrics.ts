import { metrics } from '@opentelemetry/api';

const METER_NAME = '@nauticalstream/realtime';

const meter = metrics.getMeter(METER_NAME, '1.0.0');

/**
 * Publish operation latency in milliseconds
 */
export const publishLatency = meter.createHistogram('mqtt.publish.latency.ms', {
  description: 'MQTT publish operation latency in milliseconds',
  unit: 'ms',
});

/**
 * Successful publish count
 */
export const publishSuccess = meter.createCounter('mqtt.publish.success.total', {
  description: 'Total successful MQTT publishes',
  unit: '{publish}',
});

/**
 * Failed publish attempts (before retries)
 */
export const publishAttempts = meter.createCounter('mqtt.publish.attempts.total', {
  description: 'Total MQTT publish attempts',
  unit: '{attempt}',
});

/**
 * Retry attempts triggered
 */
export const retryAttempts = meter.createCounter('mqtt.retry.attempts.total', {
  description: 'Total retry attempts triggered',
  unit: '{attempt}',
});

/**
 * Publish errors by type
 */
export const publishErrorsByType = meter.createCounter('mqtt.publish.errors.total', {
  description: 'Total MQTT publish errors by error type',
  unit: '{error}',
});

/**
 * Circuit breaker state transitions
 */
export const circuitBreakerState = meter.createUpDownCounter('mqtt.circuit_breaker.state', {
  description: 'Circuit breaker state (1=closed/healthy, 0=open/unhealthy)',
  unit: '1',
});
