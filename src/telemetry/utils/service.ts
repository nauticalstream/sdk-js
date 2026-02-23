/**
 * Service-layer span helper.
 *
 * Wraps `withSpan` with automatic injection of context fields present on every
 * request. At the service facade layer this eliminates the `tracerName` +
 * per-attribute boilerplate that every operation would otherwise duplicate.
 *
 * Automatically injected (when present and non-empty):
 *  - `correlation.id` ← ctx.correlationId  (link trace → client-propagated correlation ID)
 *  - `workspace.id`   ← ctx.workspaceId    (filter all errors/traces for a workspace)
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
  /** Maps to `correlation.id` span attribute — links trace to the client-propagated correlation ID. */
  correlationId?: string | null;
  /** Maps to `workspace.id` span attribute — enables per-workspace trace/error filtering. */
  workspaceId?: string | null;
}

/**
 * Execute `fn` inside a named OTel span with automatic telemetry injection.
 *
 * - Auto-injects `correlation.id` from `ctx.correlationId` when present.
 * - Auto-injects `workspace.id` from `ctx.workspaceId` when present.
 *   This lets on-call engineers filter all traces/errors for a specific workspace
 *   in Jaeger, Tempo, or Datadog without any per-call boilerplate.
 * - `fn` receives the active `Span` for mid-execution attribute additions.
 * - Exceptions are recorded on the span and re-thrown (OTel error semantics).
 * - Pass `null` for `ctx` in background workers or handlers with no request context.
 *
 * @param name       - Span name, e.g. `'workspace.service.create'`
 * @param ctx        - Request context; `correlationId` → `correlation.id` and `workspaceId` → `workspace.id`. Pass `null` if absent.
 * @param fn         - Operation body (sync or async). Receives the active Span.
 * @param attributes - Additional span attributes beyond the auto-injected ones.
 */
export async function withServiceSpan<T>(
  name: string,
  ctx: ServiceSpanContext | null | undefined,
  fn: (span: Span) => T | Promise<T>,
  attributes?: Record<string, string | number | boolean | string[]>,
): Promise<T> {
  const attrs: Record<string, string | number | boolean | string[]> = {};

  if (ctx?.correlationId) {
    attrs['correlation.id'] = ctx.correlationId;
  }

  if (ctx?.workspaceId) {
    attrs['workspace.id'] = ctx.workspaceId;
  }

  if (attributes) {
    Object.assign(attrs, attributes);
  }

  return withSpan(name, fn, {
    attributes: Object.keys(attrs).length > 0 ? attrs : undefined,
  });
}
