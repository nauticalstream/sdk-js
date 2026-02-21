/**
 * @nauticalstream/sdk - EventBus Module
 * 
 * NATS-based messaging for both ephemeral and persistent patterns.
 * 
 * @example
 * ```typescript
 * import { EventBus } from '@nauticalstream/sdk/eventbus';
 * 
 * const bus = new EventBus({ 
 *   servers: ['nats://localhost:4222'],
 *   name: 'my-service' 
 * });
 * 
 * await bus.connect();
 * 
 * // Core NATS (ephemeral)
 * await bus.publish(MyEventSchema, { data: 'hello' });
 * await bus.subscribe(MyEventSchema, async (data, envelope) => {
 *   console.log('Received:', data);
 * });
 * 
 * // JetStream (persistent)
 * await bus.jetstream.publish(MyEventSchema, { data: 'persistent' });
 * await bus.jetstream.subscribe(MyEventSchema, async (data, envelope) => {
 *   console.log('Persisted:', data);
 * });
 * ```
 */

// Main API
export { EventBus } from './core/eventbus';
export type { EventBusConfig } from './core/eventbus';

// Types - Core patterns
export type { 
  PublishOptions, 
  SubscribeOptions, 
  QueueGroupOptions, 
  RequestOptions, 
  ReplyOptions,
  Unsubscribe 
} from './core/types';

// Configuration
export type { RetryConfig } from './core/config';
export { DEFAULT_RETRY_CONFIG, DEFAULT_REQUEST_TIMEOUT_MS } from './core/config';

// Client (for advanced usage)
export { NatsClient } from './client/nats-client';
export type { NatsClientConfig } from './client/nats-client';

// JetStream API (for advanced usage)
export { JetStreamAPI } from './jetstream/api';

// Core NATS patterns (for advanced usage)
export { publish } from './core/publish';
export { subscribe } from './core/subscribe';
export { queueGroup } from './core/queue-group';
export { request } from './core/request';
export { reply } from './core/reply';
export type { ReplyHandlerConfig } from './core/reply';

// JetStream patterns (for advanced usage)
export { publish as jetStreamPublish } from './jetstream/publish';
export type { JetStreamPublishOptions } from './jetstream/publish';
export { subscribe as jetStreamSubscribe } from './jetstream/subscribe';
export type { SubscriberConfig, ErrorAction, ErrorClassifier } from './jetstream/subscribe';
export { defaultErrorClassifier } from './jetstream/subscribe';

// Utilities
export { deriveSubject } from './utils/derive-subject';
export type { Envelope } from './core/envelope';

// Production features - Observability & Resilience
export { resetBreaker } from './core/circuit-breaker';
export {
  jetstreamPublishLatency,
  jetstreamPublishSuccess,
  jetstreamPublishAttempts,
  jetstreamRetryAttempts,
  jetstreamPublishErrors,
  jetstreamCircuitBreakerState,
} from './core/metrics';

// Error utilities
export { classifyNatsError } from './errors/classifyNatsError';