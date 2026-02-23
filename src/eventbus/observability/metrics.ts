import { metrics } from '@opentelemetry/api';

const meter = metrics.getMeter('@nauticalstream/eventbus', '1.0.0');

/** End-to-end JetStream publish latency in milliseconds. */
export const jetstreamPublishLatency = meter.createHistogram('jetstream.publish.latency.ms', {
  description: 'JetStream publish latency in milliseconds',
  unit: 'ms',
});

/** Total successful JetStream publishes. */
export const jetstreamPublishSuccess = meter.createCounter('jetstream.publish.success.total', {
  description: 'Total successful JetStream publishes',
  unit: '{publish}',
});

/** Total JetStream publish attempts (includes retries). */
export const jetstreamPublishAttempts = meter.createCounter('jetstream.publish.attempts.total', {
  description: 'Total JetStream publish attempts',
  unit: '{attempt}',
});

/** Total retry attempts triggered by the resilience layer. */
export const jetstreamRetryAttempts = meter.createCounter('jetstream.retry.attempts.total', {
  description: 'Total JetStream retry attempts',
  unit: '{attempt}',
});

/** Total JetStream publish errors by subject. */
export const jetstreamPublishErrors = meter.createCounter('jetstream.publish.errors.total', {
  description: 'Total JetStream publish errors',
  unit: '{error}',
});

/** Circuit breaker state: 1 = closed (healthy), 0 = open (blocked). */
export const jetstreamCircuitBreakerState = meter.createUpDownCounter('jetstream.circuit_breaker.state', {
  description: 'JetStream circuit breaker state (1=closed, 0=open)',
  unit: '1',
});
