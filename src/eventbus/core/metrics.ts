import { metrics } from '@opentelemetry/api';

const METER_NAME = '@nauticalstream/eventbus';

const meter = metrics.getMeter(METER_NAME, '1.0.0');

/**
 * JetStream publish latency in milliseconds
 */
export const jetstreamPublishLatency = meter.createHistogram('jetstream.publish.latency.ms', {
  description: 'JetStream publish operation latency in milliseconds',
  unit: 'ms',
});

/**
 * Successful JetStream publishes
 */
export const jetstreamPublishSuccess = meter.createCounter('jetstream.publish.success.total', {
  description: 'Total successful JetStream publishes',
});

/**
 * JetStream publish attempts
 */
export const jetstreamPublishAttempts = meter.createCounter('jetstream.publish.attempts.total', {
  description: 'Total JetStream publish attempts',
});

/**
 * JetStream retry attempts
 */
export const jetstreamRetryAttempts = meter.createCounter('jetstream.retry.attempts.total', {
  description: 'Total JetStream retry attempts',
});

/**
 * JetStream publish errors by type
 */
export const jetstreamPublishErrors = meter.createCounter('jetstream.publish.errors.total', {
  description: 'Total JetStream publish errors by type',
});

/**
 * Circuit breaker state for JetStream
 */
export const jetstreamCircuitBreakerState = meter.createUpDownCounter('jetstream.circuit_breaker.state', {
  description: 'JetStream circuit breaker state (1=closed, 0=open)',
});
