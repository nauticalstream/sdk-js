import type { FastifyRequest } from 'fastify';
import { getCorrelationId, getTraceId, getSpanId } from '../../../telemetry';
import type { BaseContext, BusinessContext } from '../types';

/**
 * Builds base telemetry context from the incoming request.
 *
 * Reads the correlation ID from the `request.correlationId` decorator set by
 * the `fastifyTelemetry` plugin, falling back to the value in the active OTel
 * async context. Trace and span IDs come from the currently active OTel span.
 *
 * Pure extraction — no generation or side effects.
 */
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

/**
 * Extracts business identifiers from `x-user-id` and `x-workspace-id` headers.
 * Returns `undefined` for any header that is absent.
 *
 * Pure extraction — no defaults, no generation, no side effects.
 */
export function extractBusinessContext(request: FastifyRequest): BusinessContext {
  return {
    userId: request.headers['x-user-id'] as string | undefined,
    workspaceId: request.headers['x-workspace-id'] as string | undefined,
  };
}
