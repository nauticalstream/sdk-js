// Main RealtimeClient API
export { RealtimeClient } from './core/realtime-client';

// Configuration
export type { RetryConfig, RealtimeClientConfig, PublishOptions, QoS } from './core/config';

// MQTT Client
export { MQTTClientManager, type MQTTClientConfig } from './client/mqtt-client';

// Topics
export { TOPICS, chatTopics, presenceTopics, notificationTopics, workspaceTopics } from './topics';

// Utilities
export { serializeProto, deserializeProto } from './utils/serialization';
export { createPublishProperties, withPublishSpan, withMessageSpan } from './core/telemetry';

// Circuit Breaker (for operational management)
export { resetBreaker, getBreakerMetrics } from './core/circuit-breaker';

// Metrics (for observability and monitoring)
export {
  publishLatency,
  publishSuccess,
  publishAttempts,
  retryAttempts,
  publishErrorsByType,
  circuitBreakerState,
} from './core/metrics';
