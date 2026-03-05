import type { FastifyRequest } from 'fastify';
import type { Context, ContextExtractor } from '../types';
import { createUserContext } from '../context';
import { getTraceId, getSpanId } from '../../../telemetry';

/**
 * Builds the universal context (telemetry + business + audit) for a request.
 * Use directly as the `context` function in `createGraphQLPlugin`.
 * 
 * All audit fields (actorId, actionSource, isUserAction, etc.) are pre-computed.
 */
export function createContext(request: FastifyRequest): Context {
  const userId = request.headers['x-user-id'] as string | undefined;
  const workspaceId = request.headers['x-workspace-id'] as string | undefined;
  
  return createUserContext(
    {
      correlationId: (request as any).correlationId,
      traceId: getTraceId(),
      spanId: getSpanId(),
      requestId: request.id,
      ip: request.ip,
      userAgent: request.headers['user-agent'],
      headers: request.headers,
    },
    userId,
    workspaceId
  );
}

/**
 * Creates a context builder that extends the universal context with
 * service-specific fields.
 *
 * @example
 * ```typescript
 * const buildContext = createContextBuilder((req) => ({
 *   tenantId: req.headers['x-tenant-id'] as string,
 * }));
 *
 * await server.register(createGraphQLPlugin({ context: buildContext, ... }));
 * ```
 */
export function createContextBuilder<T extends object>(
  extractor: ContextExtractor<T>
): (request: FastifyRequest) => Context & T {
  return (request: FastifyRequest): Context & T => ({
    ...createContext(request),
    ...extractor(request),
  });
}
