# Telemetry

OpenTelemetry SDK wrapper — traces, metrics, logs, Sentry. Call once at startup, then use helpers anywhere.

---

## Setup

```typescript
import { initTelemetry, registerShutdownHooks } from '@nauticalstream/sdk/telemetry';

initTelemetry({
  serviceName:  'workspace-service',
  environment:  process.env.NODE_ENV,
  otlp: {
    endpoint:    'http://otel-collector:4318',
    protocol:    'http',          // or 'grpc' → port 4317
    compression: 'gzip',          // optional, HTTP only
  },
  metricExport: {
    endpoint:    'http://otel-collector:4318',
    protocol:    'http',
    intervalMs:  15_000,
  },
  sampling:        { probability: 1.0 },   // 0.0–1.0
  resourceDetectors: 'auto',               // 'none' in tests
  // High-throughput tuning (>200 spans/sec):
  // batchProcessor: { maxQueueSize: 8192, scheduledDelayMillis: 1000 },
});

registerShutdownHooks(); // flushes on SIGTERM / SIGINT
```

---

## Logger

```typescript
import { createLogger } from '@nauticalstream/sdk/telemetry';

const logger = createLogger({
  name:  'workspace-service',
  level: process.env.LOG_LEVEL ?? 'info',
  sentry: { enabled: true, minLevel: 'error' },  // optional
});

// traceId / spanId / correlationId auto-injected when in context
logger.info({ workspaceId }, 'workspace created');
logger.error({ err }, 'handler failed');
```

---

## Correlation ID

```typescript
import { withEnsuredCorrelationId, withCorrelationId, peekCorrelationId } from '@nauticalstream/sdk/telemetry';

// ✅ NATS subscriber / cron / HTTP handler entry point
await withEnsuredCorrelationId(async (correlationId) => {
  logger.info('handling message');   // correlationId injected automatically
  await handleEvent(msg);
});

// ✅ HTTP — prefer incoming header, fall back to fresh UUID
const headerId = req.headers['x-correlation-id'] as string | undefined;
if (headerId) {
  await withCorrelationId(headerId, () => handler(req, reply));
} else {
  await withEnsuredCorrelationId(() => handler(req, reply));
}

// ✅ Read without side-effects (log mixins, Sentry enrichment)
const id = peekCorrelationId(); // undefined when no context — never fakes a UUID
```

---

## Spans

```typescript
import {
  withSpan, withServerSpan, withClientSpan,
  withConsumerSpan, withProducerSpan, withTracedPublish,
} from '@nauticalstream/sdk/telemetry';

// Internal business logic
const result = await withSpan('process-order', async (span) => {
  span.setAttribute('order.id', orderId);
  return processOrder(orderId);
});

// Inbound HTTP — extracts W3C trace context from headers
await withServerSpan('POST /orders', handler, req.headers);

// Outbound HTTP / DB call
const users = await withClientSpan('users-service.getUser', () => fetch(...));

// NATS subscriber — links to publisher's span automatically
await withConsumerSpan('workspace.v1.created', msg.headers, async (span) => {
  span.setAttribute('workspace.id', workspaceId);
  await handle();
});

// NATS publish — all-in-one: PRODUCER span + trace headers injected in correct order
await withTracedPublish('workspace.v1.created', correlationId, async (span, headers) => {
  span.setAttribute('workspace.id', workspaceId);
  await js.publish(subject, payload, { headers });
});
```

---

## Metrics

```typescript
import { recordCounter, recordHistogram, addUpDownCounter, createObservableGauge, startTimer } from '@nauticalstream/sdk/telemetry';

recordCounter('http_requests_total', 1, { method: 'POST', status: 200 });

recordHistogram('db_query_duration', 42.3, { table: 'workspaces' }, { unit: 'ms' });

addUpDownCounter('active_connections',  1);  // on connect
addUpDownCounter('active_connections', -1);  // on disconnect

createObservableGauge('heap_used_bytes', () => process.memoryUsage().heapUsed);

const stop = startTimer('handler_duration', { subject: 'workspace.v1.created' });
await handle();
stop({ success: true });
```

---

## Sentry

```typescript
import { initSentry } from '@nauticalstream/sdk/telemetry';

initSentry({
  dsn:              process.env.SENTRY_DSN!,
  environment:      process.env.NODE_ENV!,
  release:          process.env.npm_package_version,
  enabled:          process.env.NODE_ENV === 'production',
  tracesSampleRate: 0,   // sampling already controlled by OTel ParentBasedSampler
});
```

---

## Shutdown

```typescript
import { shutdownTelemetry } from '@nauticalstream/sdk/telemetry';
import { closeSentry } from '@nauticalstream/sdk/telemetry';

process.on('SIGTERM', async () => {
  await shutdownTelemetry(); // flush spans + metrics
  await closeSentry();       // flush Sentry queue
  process.exit(0);
});
```
