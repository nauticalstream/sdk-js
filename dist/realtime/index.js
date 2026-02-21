/**
 * @nauticalstream/sdk - Realtime Module
 *
 * MQTT-based realtime messaging for pub/sub patterns.
 *
 * @example
 * ```typescript
 * import { RealtimeClient } from '@nauticalstream/sdk/realtime';
 *
 * const client = new RealtimeClient({
 *   brokerUrl: 'mqtt://localhost:1883',
 *   name: 'my-service',
 *   clientId: 'my-client-id'
 * });
 *
 * await client.connect();
 *
 * // Publish protobuf message
 * await client.publish(
 *   'chat/messages',
 *   ChatMessageSchema,
 *   { content: 'Hello' }
 * );
 *
 * // Publish JSON
 * await client.publishJSON(
 *   'presence/status',
 *   { userId: '123', status: 'online' }
 * );
 * ```
 */
// Main API
export { RealtimeClient } from './core/realtime-client';
// Client (for advanced usage)
export { MQTTClientManager } from './client/mqtt-client';
// Topics
export { TOPICS, chatTopics, presenceTopics, notificationTopics, workspaceTopics } from './topics';
// Utilities
export { serializeProto, deserializeProto } from './utils/serialization';
export { createPublishProperties, withPublishSpan, withMessageSpan } from './core/telemetry';
// Production features - Observability & Resilience
export { resetBreaker, getBreakerMetrics } from './core/circuit-breaker';
export { publishLatency, publishSuccess, publishAttempts, retryAttempts, publishErrorsByType, circuitBreakerState, } from './core/metrics';
// Error utilities
export { classifyMQTTError } from './errors/classifyMQTTError';
//# sourceMappingURL=index.js.map