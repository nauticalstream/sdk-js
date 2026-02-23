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
 * import type { ChatMessage } from '@nauticalstream/proto/chat/v1/chat_pb';
 *
 * // Publish message (proto type for type safety, JSON over the wire)
 * await client.publish<ChatMessage>(
 *   TOPICS.CHAT.conversation(conversationId),
 *   { content: 'Hello', authorId: userId }
 * );
 *
 * // Subscribe and receive typed messages
 * await client.subscribe(TOPICS.CHAT.conversation(conversationId));
 * client.onMessage<ChatMessage>((topic, msg) => {
 *   console.log(msg.content);
 * });
 * ```
 */
export { RealtimeClient } from './core/realtime-client';
export type { RetryConfig, RealtimeClientConfig, PublishOptions, QoS } from './core/config';
export { MQTTClientManager, type MQTTClientConfig } from './client/mqtt-client';
export { TOPICS, chatTopics, presenceTopics, notificationTopics, workspaceTopics } from './topics';
export { serialize, deserialize } from './utils/serialization';
export { createPublishProperties, withPublishSpan, withMessageSpan } from './core/telemetry';
export { resetBreaker, getBreakerMetrics } from './core/circuit-breaker';
export { publishLatency, publishSuccess, publishAttempts, retryAttempts, publishErrorsByType, circuitBreakerState, } from './core/metrics';
export { classifyMQTTError } from './errors/classifyMQTTError';
//# sourceMappingURL=index.d.ts.map