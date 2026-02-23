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
export { EventBus } from './eventbus';
export type { EventBusConfig } from './eventbus';
export type { PublishOptions, SubscribeOptions, QueueGroupOptions, RequestOptions, ReplyOptions, Unsubscribe, } from './types';
export type { RetryConfig } from './config';
export { DEFAULT_RETRY_CONFIG, DEFAULT_REQUEST_TIMEOUT_MS } from './config';
export type { Envelope, Event } from './envelope';
export { buildEnvelope, parseEnvelope } from './envelope';
export { NatsClient } from './client/nats-client';
export type { NatsClientConfig } from './client/nats-client';
export { JetStreamAPI } from './jetstream/api';
export { publish as jetStreamPublish, resetBreaker } from './jetstream/publish';
export type { JetStreamPublishOptions } from './jetstream/publish';
export { subscribe as jetStreamSubscribe, defaultErrorClassifier } from './jetstream/subscribe';
export type { SubscriberConfig, ErrorAction, ErrorClassifier } from './jetstream/subscribe';
export { publish } from './nats/publish';
export { subscribe } from './nats/subscribe';
export { queueGroup } from './nats/queue-group';
export { request } from './nats/request';
export { reply } from './nats/reply';
export type { ReplyHandlerConfig } from './nats/reply';
export { jetstreamPublishLatency, jetstreamPublishSuccess, jetstreamPublishAttempts, jetstreamRetryAttempts, jetstreamPublishErrors, jetstreamCircuitBreakerState, } from './observability/metrics';
export { classifyNatsError } from './errors/classify';
export { deriveSubject } from './utils/derive-subject';
//# sourceMappingURL=index.d.ts.map