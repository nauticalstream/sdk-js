import type { FastifyRequest } from 'fastify';
import type { Context, ContextExtractor } from '../types';
import { createBaseContext, extractBusinessContext } from './base';

/**
 * Builds the universal context (telemetry + business) for a request.
 * Use directly as the `context` function in `createGraphQLPlugin`.
 */
export function createContext(request: FastifyRequest): Context {
  return {
    ...createBaseContext(request),
    ...extractBusinessContext(request),
  };
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
