/**
 * Service-layer span helper.
 *
 * Wraps `withSpan` with automatic `request.id` injection from `ctx.correlationId`.
 * Use at the service facade layer in place of `withInternalSpan` — eliminates
 * the `tracerName` + `request.id` boilerplate that every service would otherwise
 * duplicate on every operation.
 *
 * Log↔trace correlation happens automatically via the pino mixin in `createLogger`
 * which reads `correlationId`, `traceId`, and `spanId` from the OTel async context
 * on every log line — no manual wiring needed.
 *
 * @example
 * ```typescript
 * // Service layer — ctx is the Fastify request context
 * create(input: unknown, ctx: Context): Promise<Workspace> {
 *   return withServiceSpan('workspace.service.create', ctx, () =>
 *     this.createWorkspace.execute(input, ctx),
 *     { operation: 'create' }
 *   );
 * }
 *
 * // Background worker / eventbus handler — no request context
 * lookup(id: string): Promise<Workspace | null> {
 *   return withServiceSpan('workspace.service.lookup', null, () =>
 *     this.lookupWorkspace.execute(id),
 *     { 'workspace.id': id, operation: 'read' }
 *   );
 * }
 * ```
 */

import type { Span } from '@opentelemetry/api';
import { withSpan } from './tracing';

/** Minimal context shape accepted by `withServiceSpan`. */
export interface ServiceSpanContext {
  correlationId?: string | null;
}

/**
 * Execute `fn` inside a named OTel span with automatic telemetry injection.
 *
 * - Auto-injects `request.id` from `ctx.correlationId` when present.
 *   This allows finding the full trace in Jaeger/Tempo from a customer-reported
 *   request ID without exposing internal trace IDs to clients.
 * - `fn` receives the active `Span` for mid-execution attribute additions.
 * - Exceptions are recorded on the span and re-thrown (OTel error semantics).
 * - Pass `null` for `ctx` in background workers or handlers with no request context.
 *
 * @param name       - Span name, e.g. `'workspace.service.create'`
 * @param ctx        - Request context; only `correlationId` is read. Pass `null` if absent.
 * @param fn         - Operation body (sync or async). Receives the active Span.
 * @param attributes - Additional span attributes beyond `request.id`.
 */
export async function withServiceSpan<T>(
  name: string,
  ctx: ServiceSpanContext | null | undefined,
  fn: (span: Span) => T | Promise<T>,
  attributes?: Record<string, string | number | boolean | string[]>,
): Promise<T> {
  const attrs: Record<string, string | number | boolean | string[]> = {};

  if (ctx?.correlationId) {
    attrs['request.id'] = ctx.correlationId;
  }

  if (attributes) {
    Object.assign(attrs, attributes);
  }

  return withSpan(name, fn, {
    attributes: Object.keys(attrs).length > 0 ? attrs : undefined,
  });
}
