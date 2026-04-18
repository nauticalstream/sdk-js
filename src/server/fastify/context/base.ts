import type { FastifyRequest } from 'fastify';
import { getCorrelationId, getTraceId, getSpanId } from '../../../telemetry/index.js';
import type { Context } from '../types.js';
import { extractUserFromHeaders } from './identity.js';

/**
 * Builds base telemetry context from the incoming request.
 *
 * Reads the correlation ID from the `request.correlationId` decorator set by
 * the `fastifyTelemetry` plugin, falling back to the value in the active OTel
 * async context. Trace and span IDs come from the currently active OTel span.
 *
 * Pure extraction — no generation or side effects.
 * 
 * @deprecated Use createUserContext from context.ts instead
 */
export function createBaseContext(request: FastifyRequest): Partial<Context> {
  const currencyHeader = request.headers['x-currency'];
  const currency = typeof currencyHeader === 'string'
    ? currencyHeader.trim().toUpperCase()
    : Array.isArray(currencyHeader)
      ? currencyHeader[0]?.trim().toUpperCase()
      : undefined;

  return {
    correlationId: (request as any).correlationId || getCorrelationId(),
    traceId: getTraceId(),
    spanId: getSpanId(),
    ip: request.ip,
    userAgent: request.headers['user-agent'] as string | undefined,
    headers: request.headers,
    currency: currency && /^[A-Z]{3}$/.test(currency) ? currency : undefined,
  };
}

/**
 * Extracts business identifiers from `x-user-id`, `x-userinfo`, and `x-workspace-id` headers.
 * Returns `undefined` for any header that is absent.
 *
 * Pure extraction — no defaults, no generation, no side effects.
 * 
 * @deprecated Use createUserContext from context.ts instead
 */
export function extractBusinessContext(request: FastifyRequest): Partial<Context> {
  const user = extractUserFromHeaders(request.headers);

  return {
    user,
    userId: user?.sub,
    workspaceId: request.headers['x-workspace-id'] as string | undefined,
  };
}
