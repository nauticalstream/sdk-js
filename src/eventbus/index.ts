// Main EventBus API
export { EventBus } from './core/eventbus';
export type { EventBusConfig } from './core/eventbus';

// Configuration
export type { RetryConfig } from './core/config';

// Envelope utility (exposed for advanced use — services normally don't need this)
export type { Envelope } from './core/envelope';

// JetStream API
export { JetStreamAPI } from './jetstream/api';

// Client
export { NatsClient } from './client/nats-client';
export type { NatsClientConfig } from './client/nats-client';

// Core NATS patterns
export { publish } from './core/publish';
export { subscribe } from './core/subscribe';
export { queueGroup } from './core/queue-group';
export { request } from './core/request';
export { reply } from './core/reply';
export type { ReplyHandlerConfig } from './core/reply';

// JetStream patterns
export { publish as jetStreamPublish } from './jetstream/publish';
export { subscribe as jetStreamSubscribe } from './jetstream/subscribe';
export type { SubscriberConfig, ErrorAction, ErrorClassifier } from './jetstream/subscribe';
export { defaultErrorClassifier } from './jetstream/subscribe';

// Subjects
export { SUBJECTS } from './subjects';
export type { Subject, ChatSubject, UserSubject, WorkspaceSubject, SocialSubject, PostSubject, PlacesSubject, StorageSubject, PlatformSubject } from './subjects';

// Circuit Breaker (for operational management)
export { resetBreaker } from './core/circuit-breaker';

// Metrics (for observability and monitoring)
export {
  jetstreamPublishLatency,
  jetstreamPublishSuccess,
  jetstreamPublishAttempts,
  jetstreamRetryAttempts,
  jetstreamPublishErrors,
  jetstreamCircuitBreakerState,
} from './core/metrics';