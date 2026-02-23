# Server

Fastify server factory with pre-wired plugins: OTel tracing, structured logging, CORS, health checks, GraphQL (Mercurius), and request context extraction.

---

## Setup

```typescript
import { createFastifyServer } from '@nauticalstream/sdk/server';

const app = await createFastifyServer({
  serviceName: 'workspace-service',
  logger,
  cors:        { origin: process.env.CORS_ORIGIN ?? '*' },
  health: {
    checks: {
      db:   () => db.$queryRaw`SELECT 1`,
      nats: () => bus.checkHealth(),
    },
  },
});

await app.listen({ port: 3000, host: '0.0.0.0' });
```

---

## Request context

Every request gets a typed `Context` extracted from headers and injected into all handlers.

```typescript
import { createContext, type Context } from '@nauticalstream/sdk/server';

// Fastify plugin — attach context to each request
app.addHook('preHandler', async (req) => {
  req.ctx = createContext(req);
});

// Handler — destructure what you need
async function handler(req: FastifyRequest) {
  const { correlationId, workspaceId, userId } = req.ctx;
}
```

**Context fields extracted from headers:**

| Header | `ctx` field |
|---|---|
| `x-correlation-id` | `correlationId` |
| `x-workspace-id` | `workspaceId` |
| `x-user-id` | `userId` |
| `authorization` | `token` |

---

## Plugins (individual)

```typescript
import {
  fastifyTelemetry,
  fastifyRequestLogging,
  fastifyObservability,
  fastifyCors,
} from '@nauticalstream/sdk/server';

// OTel — injects traceId/spanId into every request context
await app.register(fastifyTelemetry, { serviceName: 'workspace-service' });

// Structured request logs (pino) — includes correlationId, latency, status
await app.register(fastifyRequestLogging);

// Prometheus metrics — http_requests_total, http_request_duration_ms
await app.register(fastifyObservability);

// CORS
await app.register(fastifyCors, { origin: '*' });
```

---

## GraphQL

```typescript
import { createGraphQLPlugin } from '@nauticalstream/sdk/server';

await app.register(createGraphQLPlugin({
  schema,
  resolvers,
  context: (req) => req.ctx,
}));
```

---

## Health check

```typescript
import { createHealthPlugin } from '@nauticalstream/sdk/server';

await app.register(createHealthPlugin({
  checks: {
    db:   () => db.$queryRaw`SELECT 1`,
    nats: () => bus.checkHealth(),
  },
}));

// GET /health → { status: 'ok' | 'degraded' | 'down', checks: { db: 'ok', nats: 'ok' } }
```
