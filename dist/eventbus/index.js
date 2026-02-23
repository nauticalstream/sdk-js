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
export { EventBus } from './eventbus';
export { DEFAULT_RETRY_CONFIG, DEFAULT_REQUEST_TIMEOUT_MS } from './config';
export { buildEnvelope, parseEnvelope } from './envelope';
// ── Client ────────────────────────────────────────────────────────────────────
export { NatsClient } from './client/nats-client';
// ── JetStream (advanced) ──────────────────────────────────────────────────────
export { JetStreamAPI } from './jetstream/api';
export { publish as jetStreamPublish, resetBreaker } from './jetstream/publish';
export { subscribe as jetStreamSubscribe, defaultErrorClassifier } from './jetstream/subscribe';
// ── Core NATS patterns (advanced) ─────────────────────────────────────────────
export { publish } from './nats/publish';
export { subscribe } from './nats/subscribe';
export { queueGroup } from './nats/queue-group';
export { request } from './nats/request';
export { reply } from './nats/reply';
// ── Observability ─────────────────────────────────────────────────────────────
export { jetstreamPublishLatency, jetstreamPublishSuccess, jetstreamPublishAttempts, jetstreamRetryAttempts, jetstreamPublishErrors, jetstreamCircuitBreakerState, } from './observability/metrics';
// ── Errors ────────────────────────────────────────────────────────────────────
export { classifyNatsError } from './errors/classify';
// ── Utilities ─────────────────────────────────────────────────────────────────
export { deriveSubject } from './utils/derive-subject';
//# sourceMappingURL=index.js.map