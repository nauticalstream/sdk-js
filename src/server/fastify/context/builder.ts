import type { FastifyRequest } from 'fastify';
import type { Context, ContextExtractor } from '../types.js';
import { createUserContext } from '../context.js';
import { getTraceId, getSpanId } from '../../../telemetry/index.js';
import { extractUserFromHeaders } from './identity.js';

/**
 * Builds the universal context (telemetry + business + audit) for a request.
 * Use directly as the `context` function in `createGraphQLPlugin`.
 * 
 * All audit fields (actorId, actionSource, isUserAction, etc.) are pre-computed.
 */
export function createContext(request: FastifyRequest): Context {
  const user = extractUserFromHeaders(request.headers);
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
    user?.sub,
    workspaceId,
    user
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
