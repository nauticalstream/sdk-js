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

// Main API
export { RealtimeClient } from './core/realtime-client.js';

// Configuration
export type { 
  RetryConfig, 
  RealtimeClientConfig, 
  PublishOptions, 
  QoS 
} from './core/config.js';

// Client (for advanced usage)
export { MQTTClientManager, type MQTTClientConfig } from './client/mqtt-client.js';

// Topics
export { 
  TOPICS, 
  chatTopics, 
  presenceTopics, 
  notificationTopics, 
  workspaceTopics 
} from './topics/index.js';

// Utilities
export { serialize, deserialize } from './utils/serialization.js';
export { createPublishProperties, withPublishSpan, withMessageSpan } from './core/telemetry.js';
export { generateClientId } from './utils/client-id.js';
export { deriveSubject } from './utils/derive-subject.js';

// NOTE: JwtUtils moved to @nauticalstream/sdk/realtime/jwt (Node.js only)
// For server-side JWT signing, import from '@nauticalstream/sdk/realtime/jwt'

// Production features - Observability & Resilience
export { resetBreaker, getBreakerMetrics } from './core/circuit-breaker.js';
export {
  publishLatency,
  publishSuccess,
  publishAttempts,
  retryAttempts,
  publishErrorsByType,
  circuitBreakerState,
} from './core/metrics.js';

// Error utilities
export { classifyMQTTError } from './errors/classifyMQTTError.js';
