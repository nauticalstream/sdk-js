import { context, propagation, trace, type Span, type Context, createContextKey } from '@opentelemetry/api';
import { randomUUID } from 'node:crypto';

const CORRELATION_ID_KEY = createContextKey('correlationId');

// ── Core accessors ─────────────────────────────────────────────────────────────

/**
 * Returns the correlation ID stored in the active context, or `undefined`
 * when none has been set.
 *
 * Prefer this in mixins/middleware where you only want to emit the ID
 * when it actually exists — no fake UUIDs in unscoped log lines.
 */
export function peekCorrelationId(): string | undefined {
  return context.active().getValue(CORRELATION_ID_KEY) as string | undefined;
}

/**
 * Returns the correlation ID from the active context.
 * Falls back to generating a new UUID when none is set.
 *
 * NOTE: each call outside a `withCorrelationId` / `getOrCreateCorrelationId`
 * scope returns a *different* UUID because the generated value is not stored
 * in context. Use `peekCorrelationId()` in log mixins to avoid emitting stale
 * UUIDs, or use `getOrCreateCorrelationId()` when you need stable propagation.
 *
 * Kept for backward compatibility.
 */
export function getCorrelationId(): string {
  return peekCorrelationId() ?? generateCorrelationId();
}

/**
 * Runs `fn` within a correlation ID context.
 * Reuses the existing ID if one is already in context, otherwise generates a
 * new UUID. The ID is passed to `fn` and visible to `peekCorrelationId()`
 * throughout the entire async call chain.
 *
 * Use this at every async entry point (NATS subscribers, HTTP handlers, cron
 * jobs) so that every log line and span in the handler shares a stable,
 * unique ID without manual ID threading.
 *
 * @example
 * // NATS subscriber
 * await withEnsuredCorrelationId(async (id) => {
 *   logger.info('handling message'); // correlationId injected automatically
 *   await handleWorkspaceCreated(msg);
 * });
 *
 * // HTTP handler — prefer header value, fall back to a fresh UUID
 * const headerId = req.headers['x-correlation-id'] as string | undefined;
 * if (headerId) {
 *   await withCorrelationId(headerId, () => handler(req, reply));
 * } else {
 *   await withEnsuredCorrelationId(() => handler(req, reply));
 * }
 */
export async function withEnsuredCorrelationId<T>(
  fn: (correlationId: string) => T | Promise<T>
): Promise<T> {
  const existing = peekCorrelationId();
  // If already in context, reuse it — no wrapping needed.
  if (existing) return fn(existing);

  const id = generateCorrelationId();
  return context.with(setCorrelationId(id), () => fn(id));
}

/**
 * @deprecated
 * - To read without side effects: use `peekCorrelationId()`.
 * - To guarantee a stable ID for the full async chain: use `withEnsuredCorrelationId(fn)`.
 *
 * This function is now a simple peek-or-generate with no context storage.
 */
export async function getOrCreateCorrelationId(): Promise<string> {
  return peekCorrelationId() ?? generateCorrelationId();
}

// ── Context helpers ────────────────────────────────────────────────────────────

/**
 * Returns a new Context with the correlation ID stored as a context value.
 */
export function setCorrelationId(correlationId: string, ctx?: Context): Context {
  const activeContext = ctx ?? context.active();
  return activeContext.setValue(CORRELATION_ID_KEY, correlationId);
}

/**
 * Executes `fn` with `correlationId` stored in the active context.
 * Any `peekCorrelationId()` / `getCorrelationId()` call inside will return it.
 */
export async function withCorrelationId<T>(
  correlationId: string,
  fn: () => T | Promise<T>
): Promise<T> {
  const ctx = setCorrelationId(correlationId);
  return context.with(ctx, fn);
}

// ── W3C Baggage helpers ────────────────────────────────────────────────────────

const BAGGAGE_CORRELATION_KEY = 'correlation-id';

/**
 * Stores the correlation ID in W3C Baggage on the active context.
 * Use this when propagating the ID across service boundaries via HTTP
 * so it flows through all downstream spans automatically.
 */
export function setCorrelationIdInBaggage(correlationId: string, ctx?: Context): Context {
  const base = ctx ?? context.active();
  const existing = propagation.getBaggage(base) ?? propagation.createBaggage();
  const updated = existing.setEntry(BAGGAGE_CORRELATION_KEY, { value: correlationId });
  return propagation.setBaggage(base, updated);
}

/**
 * Reads the correlation ID from W3C Baggage on the active (or provided) context.
 * Returns `undefined` when the baggage key is absent.
 */
export function getCorrelationIdFromBaggage(ctx?: Context): string | undefined {
  const base = ctx ?? context.active();
  return propagation.getBaggage(base)?.getEntry(BAGGAGE_CORRELATION_KEY)?.value;
}

// ── Span / trace ID helpers ────────────────────────────────────────────────────

/** Returns the trace ID of the active span, or `undefined` when no span is active. */
export function getTraceId(): string | undefined {
  return trace.getActiveSpan()?.spanContext().traceId;
}

/** Returns the span ID of the active span, or `undefined` when no span is active. */
export function getSpanId(): string | undefined {
  return trace.getActiveSpan()?.spanContext().spanId;
}

/** Returns the active span, or `undefined` when none exists. */
export function getActiveSpan(): Span | undefined {
  return trace.getActiveSpan();
}

// ── Generator ─────────────────────────────────────────────────────────────────

/** Generates a UUID v4 correlation ID. */
export function generateCorrelationId(): string {
  return randomUUID();
}
