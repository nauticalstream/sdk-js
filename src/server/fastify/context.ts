import type { FastifyRequest } from 'fastify';
import { getCorrelationId, getTraceId, getSpanId } from '../../telemetry';
import type { BaseContext, BusinessContext, UniversalContext, ContextExtractor } from './types';

/** Builds base telemetry context from the incoming request */
export function createBaseContext(request: FastifyRequest): BaseContext {
  return {
    correlationId: (request as any).correlationId || getCorrelationId(),
    traceId: getTraceId(),
    spanId: getSpanId(),
    ip: request.ip,
    userAgent: request.headers['user-agent'] as string | undefined,
    headers: request.headers,
  };
}

/** Extracts business identifiers from `x-user-id` and `x-workspace-id` headers */
export function extractBusinessContext(request: FastifyRequest): BusinessContext {
  return {
    userId: request.headers['x-user-id'] as string | undefined,
    workspaceId: request.headers['x-workspace-id'] as string | undefined,
  };
}

/**
 * Builds the universal context (telemetry + business) for a request.
 * Use directly as the `context` function in `createGraphQLPlugin`.
 */
export function createUniversalContext(request: FastifyRequest): UniversalContext {
  return {
    ...createBaseContext(request),
    ...extractBusinessContext(request),
  };
}

/**
 * Creates a context builder that extends the universal context with service-specific fields.
 *
 * @example
 * const buildContext = createContextBuilder((req) => ({
 *   tenantId: req.headers['x-tenant-id'] as string,
 * }));
 *
 * await server.register(createGraphQLPlugin({ context: buildContext, ... }));
 */
export function createContextBuilder<T extends object>(
  extractor: ContextExtractor<T>
): (request: FastifyRequest) => UniversalContext & T {
  return (request: FastifyRequest): UniversalContext & T => {
    return {
      ...createUniversalContext(request),
      ...extractor(request),
    };
  };
}
