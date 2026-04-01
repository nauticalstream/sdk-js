/**
 * @nauticalstream/sdk — EventBus
 *
 * NATS-based messaging: ephemeral Core NATS + persistent JetStream.
 * All messages are platform.v1.Event envelopes encoded as JSON on the wire.
 *
 * @example
 * ```typescript
 * import { EventBus } from '@nauticalstream/sdk/eventbus';
 *
 * const bus = new EventBus({ servers: ['nats://localhost:4222'], name: 'my-service' });
 * await bus.connect();
 *
 * // Core NATS (ephemeral)
 * await bus.publish(MyEventSchema, { field: 'value' });
 * await bus.subscribe(MyEventSchema, async (data, envelope) => { ... });
 *
 * // JetStream (persistent)
 * await bus.jetstream.publish(MyEventSchema, { field: 'value' });
 * await bus.jetstream.subscribe({ stream: 'MY_STREAM', consumer: 'svc', subject: 'my.>', schema: MyEventSchema, handler: async (data, envelope) => { ... } });
 * ```
 */

// ── Main facade ──────────────────────────────────────────────────────────────
export { EventBus } from './eventbus.js';
export type { EventBusConfig } from './eventbus.js';

// ── Option types ─────────────────────────────────────────────────────────────
export type {
  PublishOptions,
  SubscribeOptions,
  QueueGroupOptions,
  RequestOptions,
  ReplyOptions,
  Unsubscribe,
} from './types.js';

// ── Config / constants ────────────────────────────────────────────────────────
export type { RetryConfig } from './config.js';
export { DEFAULT_RETRY_CONFIG, DEFAULT_REQUEST_TIMEOUT_MS } from './config.js';

// ── Envelope & proto Event ────────────────────────────────────────────────────
export type { Envelope, Event } from './envelope.js';
export { buildEnvelope, parseEnvelope } from './envelope.js';

// ── Client ────────────────────────────────────────────────────────────────────
export { NatsClient } from './client/nats-client.js';
export type { NatsClientConfig } from './client/nats-client.js';

// ── JetStream (advanced) ──────────────────────────────────────────────────────
export { JetStreamAPI } from './jetstream/api.js';
export { publish as jetStreamPublish, resetBreaker } from './jetstream/publish.js';
export type { JetStreamPublishOptions } from './jetstream/publish.js';
export { subscribe as jetStreamSubscribe, defaultErrorClassifier } from './jetstream/subscribe.js';
export type { SubscriberConfig, ErrorAction, ErrorClassifier } from './jetstream/subscribe.js';

// ── Inbox Pattern (idempotent consumption) ────────────────────────────────────
export { withIdempotentHandler, EventProcessor } from './inbox/index.js';
export { isEventProcessed, markEventProcessed } from './inbox/index.js';
export type {
  ProcessedEventData,
  JetStreamMetadata,
  IdempotentHandlerOptions,
  PrismaTransaction as InboxPrismaTransaction,
  PrismaClient as InboxPrismaClient,
} from './inbox/index.js';

// ── Outbox Pattern (transactional publishing) ─────────────────────────────────
export { OutboxPublisher } from './outbox/index.js';
export { buildOutboxRecord } from './outbox/index.js';
export type {
  OutboxRecord,
  PrismaTransaction as OutboxPrismaTransaction,
  EventSchema,
  EventData,
} from './outbox/index.js';

// ── Core NATS patterns (advanced) ─────────────────────────────────────────────
export { publish } from './nats/publish.js';
export { subscribe } from './nats/subscribe.js';
export { queueGroup } from './nats/queue-group.js';
export { request } from './nats/request.js';
export { reply } from './nats/reply.js';
export type { ReplyHandlerConfig } from './nats/reply.js';

// ── Observability ─────────────────────────────────────────────────────────────
export {
  jetstreamPublishLatency,
  jetstreamPublishSuccess,
  jetstreamPublishAttempts,
  jetstreamRetryAttempts,
  jetstreamPublishErrors,
  jetstreamCircuitBreakerState,
} from './observability/metrics.js';

// ── Errors ────────────────────────────────────────────────────────────────────
export { classifyNatsError } from './errors/classify.js';

// ── Utilities ─────────────────────────────────────────────────────────────────
export { deriveSubject } from './utils/derive-subject.js';
