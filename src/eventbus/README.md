# EventBus

NATS-based messaging facade. Core NATS for ephemeral fire-and-forget; JetStream for persistent, durable, at-least-once delivery. All messages are `platform.v1.Event` envelopes encoded as JSON.

---

## Setup

```typescript
import { EventBus } from '@nauticalstream/sdk/eventbus';

const bus = new EventBus({
  servers: [process.env.NATS_URL ?? 'nats://localhost:4222'],
  name:    'workspace-service',   // used as Event.source on every published message
  logger,                         // optional Pino logger
});

await bus.connect();

// Graceful shutdown
process.on('SIGTERM', () => bus.disconnect());
```

---

## Core NATS — ephemeral (fire-and-forget)

```typescript
// Publish
await bus.publish(WorkspaceCreatedSchema, { id: workspaceId, name });

// Subscribe (all instances receive every message)
const unsub = await bus.subscribe(WorkspaceCreatedSchema, async (data, envelope) => {
  logger.info({ correlationId: envelope.correlationId }, 'workspace created');
});
unsub(); // stop receiving

// Queue group (only one instance per group receives each message — load-balanced)
const unsub = await bus.queueGroup(WorkspaceCreatedSchema, handler, {
  group: 'workspace-service',
});

// RPC — client side
const response = await bus.request(CreateWorkspaceRequestSchema, CreateWorkspaceResponseSchema, {
  name: 'my-workspace',
});

// RPC — server side
const unsub = await bus.reply(CreateWorkspaceRequestSchema, CreateWorkspaceResponseSchema,
  async (req, envelope) => ({ id: uuid(), name: req.name })
);
```

---

## JetStream — persistent (at-least-once)

```typescript
// Publish (circuit-breaker + retry built-in)
await bus.jetstream.publish(WorkspaceCreatedSchema, { id: workspaceId, name });

// Subscribe (durable consumer — survives service restarts)
const stop = await bus.jetstream.subscribe({
  stream:   'WORKSPACE_EVENTS',
  consumer: 'workspace-processor',
  subject:  'workspace.v1.>',
  schema:   WorkspaceCreatedSchema,
  handler:  async (data, envelope) => {
    await processWorkspace(data);
  },
  // Optional:
  concurrency:     3,                            // parallel message processing
  retryDelayMs:    500,
  errorClassifier: (err) => {
    if (err instanceof ValidationError) return 'discard';     // ACK, don't retry
    if (err instanceof PoisonMessageError) return 'deadletter'; // TERM, manual review
    return 'retry';                                            // NAK, redeliver
  },
});

await stop(); // drain consumer gracefully on shutdown
```

---

## With OTel trace propagation

Use `withTracedPublish` (from telemetry) for publish and `withConsumerSpan` for subscribe — spans stitch across the NATS boundary automatically.

```typescript
import { withTracedPublish, withConsumerSpan, withEnsuredCorrelationId } from '@nauticalstream/sdk/telemetry';

// Publisher
await withTracedPublish('workspace.v1.created', correlationId, async (span, headers) => {
  span.setAttribute('workspace.id', workspaceId);
  await bus.publish(WorkspaceCreatedSchema, payload, { headers });
});

// Subscriber
const stop = await bus.jetstream.subscribe({
  stream: 'WORKSPACE_EVENTS', consumer: 'svc', subject: 'workspace.v1.>',
  schema: WorkspaceCreatedSchema,
  handler: async (data, envelope) => {
    await withEnsuredCorrelationId(async () => {
      await withConsumerSpan('workspace.v1.created', envelope.natsHeaders, async (span) => {
        span.setAttribute('workspace.id', data.id);
        await processWorkspace(data);
      });
    });
  },
});
```

---

## Error actions (JetStream)

| Action | NATS command | When to use |
|---|---|---|
| `'retry'` | NAK — redelivery after `retryDelayMs` | Transient: network, DB timeout |
| `'discard'` | ACK — message removed | Permanent: validation error, bad schema |
| `'deadletter'` | TERM — poison, manual review | Unrecoverable: corrupt payload |
