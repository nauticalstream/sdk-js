# Errors

Shared error hierarchy for all Nauticalstream services. Two branches: **domain exceptions** (client errors, non-retryable) and **system exceptions** (infrastructure errors, retryable). Includes converters to/from proto `Error` envelopes and formatters for GraphQL, HTTP, and JetStream.

---

## Throwing errors

```typescript
import {
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  ValidationError,
  ConflictError,
  DatabaseError,
  ServiceUnavailableError,
  TimeoutError,
} from '@nauticalstream/sdk/errors';

throw new NotFoundError('Workspace', workspaceId);
throw new UnauthorizedError('missing token');
throw new ForbiddenError('insufficient role');
throw new ValidationError('name is required');
throw new ConflictError('workspace slug already taken');

// Infrastructure — these signal retryable failures
throw new DatabaseError('connection lost');
throw new ServiceUnavailableError('payments-service');
throw new TimeoutError('workspace-service', 5000);
```

---

## GraphQL formatter

```typescript
import { formatGraphQLError } from '@nauticalstream/sdk/errors';

server.register(mercurius, {
  schema,
  resolvers,
  errorFormatter: formatGraphQLError,
});
```

---

## HTTP formatter

```typescript
import { formatHttpError } from '@nauticalstream/sdk/errors';

fastify.setErrorHandler((err, req, reply) => {
  const { statusCode, body } = formatHttpError(err);
  reply.status(statusCode).send(body);
});
```

---

## Proto converters

```typescript
import { toProtoError, fromProtoError } from '@nauticalstream/sdk/errors';
import { ResourceType } from '@nauticalstream/sdk/errors';

// Exception → proto envelope (publish over NATS/MQTT)
const protoError = toProtoError(err, {
  optimisticId:  input.optimisticId,
  resourceType:  ResourceType.WORKSPACE,
});
await mqtt.publish(`user/${userId}/errors`, protoError);

// Proto envelope → typed exception (on the receiving side)
const exception = fromProtoError(protoError);
```

---

## JetStream error boundary

```typescript
import { withErrorBoundary } from '@nauticalstream/sdk/errors';

const stop = await bus.jetstream.subscribe({
  stream: 'WORKSPACE_EVENTS', consumer: 'svc', subject: 'workspace.v1.>',
  schema: WorkspaceCreatedSchema,
  handler: withErrorBoundary(async (data, envelope) => {
    await processWorkspace(data);
  }),
});
```

---

## Error hierarchy

| Class | Branch | HTTP | Retryable |
|---|---|---|---|
| `NotFoundError` | domain | 404 | no |
| `UnauthorizedError` | domain | 401 | no |
| `ForbiddenError` | domain | 403 | no |
| `ValidationError` | domain | 422 | no |
| `ConflictError` | domain | 409 | no |
| `OperationError` | domain | 400 | no |
| `DatabaseError` | system | 503 | yes |
| `ServiceUnavailableError` | system | 503 | yes |
| `NetworkError` | system | 502 | yes |
| `TimeoutError` | system | 504 | yes |
