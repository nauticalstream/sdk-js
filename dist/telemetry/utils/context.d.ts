import { type Span, type Context } from '@opentelemetry/api';
/**
 * Returns the correlation ID stored in the active context, or `undefined`
 * when none has been set.
 *
 * Prefer this in mixins/middleware where you only want to emit the ID
 * when it actually exists — no fake UUIDs in unscoped log lines.
 */
export declare function peekCorrelationId(): string | undefined;
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
export declare function getCorrelationId(): string;
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
export declare function withEnsuredCorrelationId<T>(fn: (correlationId: string) => T | Promise<T>): Promise<T>;
/**
 * @deprecated
 * - To read without side effects: use `peekCorrelationId()`.
 * - To guarantee a stable ID for the full async chain: use `withEnsuredCorrelationId(fn)`.
 *
 * This function is now a simple peek-or-generate with no context storage.
 */
export declare function getOrCreateCorrelationId(): Promise<string>;
/**
 * Returns a new Context with the correlation ID stored as a context value.
 */
export declare function setCorrelationId(correlationId: string, ctx?: Context): Context;
/**
 * Executes `fn` with `correlationId` stored in the active context.
 * Any `peekCorrelationId()` / `getCorrelationId()` call inside will return it.
 */
export declare function withCorrelationId<T>(correlationId: string, fn: () => T | Promise<T>): Promise<T>;
/**
 * Stores the correlation ID in W3C Baggage on the active context.
 * Use this when propagating the ID across service boundaries via HTTP
 * so it flows through all downstream spans automatically.
 */
export declare function setCorrelationIdInBaggage(correlationId: string, ctx?: Context): Context;
/**
 * Reads the correlation ID from W3C Baggage on the active (or provided) context.
 * Returns `undefined` when the baggage key is absent.
 */
export declare function getCorrelationIdFromBaggage(ctx?: Context): string | undefined;
/** Returns the trace ID of the active span, or `undefined` when no span is active. */
export declare function getTraceId(): string | undefined;
/** Returns the span ID of the active span, or `undefined` when no span is active. */
export declare function getSpanId(): string | undefined;
/** Returns the active span, or `undefined` when none exists. */
export declare function getActiveSpan(): Span | undefined;
/** Generates a UUID v4 correlation ID. */
export declare function generateCorrelationId(): string;
//# sourceMappingURL=context.d.ts.map