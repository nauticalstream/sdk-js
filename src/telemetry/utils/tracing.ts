/**
 * Unified span helpers for the Nauticalstream SDK.
 *
 * All helpers follow OTel best practices:
 *  - Correct `SpanKind` so Grafana Tempo / Jaeger produce accurate service maps.
 *  - W3C Trace Context propagation injected (PRODUCER) / extracted (CONSUMER)
 *    automatically so spans stitch across NATS message boundaries.
 *  - No stack-frame parsing, no synthetic span events, no duplicate error attrs.
 *  - `fn` receives the active Span so callers can add attributes mid-execution.
 *  - Supports both synchronous and async callbacks.
 *
 * @example
 * ```typescript
 * // Generic internal span (business logic)
 * const result = await withSpan('process-order', async (span) => {
 *   span.setAttribute('order.id', orderId);
 *   return processOrder(orderId);
 * });
 *
 * // Outbound service / DB call
 * const users = await withClientSpan('users-service.getUser', async () => fetch(...));
 *
 * // Inbound HTTP request handler (inside Fastify plugin, etc.)
 * await withServerSpan('POST /orders', async (span) => { ... }, req.headers);
 *
 * // Before publishing a NATS message
 * const headers = injectTraceHeaders();
 * bus.publish(MySchema, data, { headers });
 *
 * // Inside a NATS subscriber
 * await withConsumerSpan('workspace.v1.workspace-created', msg.headers, async () => { ... });
 * ```
 */

import {
  context,
  propagation,
  trace,
  SpanKind,
  SpanStatusCode,
  type Span,
  type SpanOptions,
  type TextMapGetter,
  type TextMapSetter,
} from '@opentelemetry/api';
import {
  SEMATTRS_MESSAGING_SYSTEM,
  SEMATTRS_MESSAGING_DESTINATION,
  SEMATTRS_MESSAGING_OPERATION,
  MESSAGINGOPERATIONVALUES_PROCESS,
} from '@opentelemetry/semantic-conventions';
import { headers as natsHeaders, type MsgHdrs } from 'nats';

const TRACER_NAME    = '@nauticalstream/sdk';
const TRACER_VERSION = process.env.npm_package_version ?? 'unknown';

// ── OTel TextMap adapters for NATS MsgHdrs ───────────────────────────────────

const natsSetter: TextMapSetter<MsgHdrs> = {
  set(carrier, key, value) { carrier.set(key, value); },
};

const natsGetter: TextMapGetter<MsgHdrs | undefined> = {
  get(carrier, key) { return carrier?.get(key) ?? undefined; },
  keys(carrier)     { return carrier ? [...carrier.keys()] : []; },
};

// Re-usable HTTP header getter — hoisted so withServerSpan doesn't allocate
// a new object on every call.
const httpHeaderGetter: TextMapGetter<Record<string, string | string[] | undefined> | undefined> = {
  get(carrier, key) {
    const v = carrier?.[key];
    return Array.isArray(v) ? v[0] : v;
  },
  keys(carrier) { return carrier ? Object.keys(carrier) : []; },
};

// ── Core helper ───────────────────────────────────────────────────────────────

/**
 * Execute `fn` inside a named OTel span.
 *
 * - Sets the span as the active span for the duration of the call.
 * - Records exceptions and sets span status to ERROR on failure.
 * - Always ends the span in `finally`.
 * - `fn` may be synchronous or async.
 */
export async function withSpan<T>(
  name: string,
  fn: (span: Span) => T | Promise<T>,
  options?: SpanOptions & { tracerName?: string }
): Promise<T> {
  const { tracerName, ...spanOptions } = options ?? {};
  const tracer = trace.getTracer(tracerName ?? TRACER_NAME, TRACER_VERSION);

  return tracer.startActiveSpan(name, spanOptions, async (span) => {
    try {
      // OTel spec §Span-Status: leave status UNSET on success.
      // Only ERROR must be set explicitly — UNSET and OK are treated identically
      // by every backend (Tempo, Jaeger, Datadog) during query/alerting.
      return await fn(span);
    } catch (error) {
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: error instanceof Error
          ? error.message.substring(0, 255)
          : String(error).substring(0, 255),
      });
      if (error instanceof Error) {
        // recordException captures exception.type, exception.message,
        // exception.stacktrace as a span event per OTel semconv.
        span.recordException(error);
      } else {
        span.recordException(new Error(String(error)));
      }
      throw error;
    } finally {
      span.end();
    }
  });
}

// ── SpanKind-specific wrappers ────────────────────────────────────────────────

/**
 * Wrap an inbound HTTP/RPC handler.
 * Sets `SpanKind.SERVER` and optionally extracts W3C trace context from HTTP
 * headers so this span becomes a child of the caller's span.
 *
 * @param name     - Span name, e.g. `'POST /orders'`
 * @param fn       - Handler body (sync or async)
 * @param headers  - Incoming HTTP headers carrier for context extraction
 */
export async function withServerSpan<T>(
  name: string,
  fn: (span: Span) => T | Promise<T>,
  headers?: Record<string, string | string[] | undefined>
): Promise<T> {
  const parentCtx = headers
    ? propagation.extract(context.active(), headers, httpHeaderGetter)
    : context.active();

  return context.with(parentCtx, () =>
    withSpan(name, fn, { kind: SpanKind.SERVER })
  );
}

/**
 * Wrap an outbound service/DB/API call.
 * Sets `SpanKind.CLIENT` — Grafana Tempo and Jaeger show this as a downstream
 * dependency edge in the service map.
 *
 * @param name - Span name, e.g. `'users-service.getUser'` or `'pg.query'`
 * @param fn   - Outbound call body (sync or async)
 */
export async function withClientSpan<T>(
  name: string,
  fn: (span: Span) => T | Promise<T>
): Promise<T> {
  return withSpan(name, fn, { kind: SpanKind.CLIENT });
}

// ── NATS messaging ────────────────────────────────────────────────────────────

/**
 * Create NATS headers with W3C trace context + correlation ID injected.
 *
 * **Must be called inside an active span** (e.g. inside `withProducerSpan` or
 * `withTracedPublish`) so the injected context includes the span ID. Calling
 * it outside any span injects a no-op context — the consumer span will start a
 * new trace with no parent.
 *
 * Prefer `withTracedPublish` which enforces the correct order automatically.
 *
 * @param correlationId - Propagated as the `x-correlation-id` NATS header.
 */
export function injectTraceHeaders(correlationId: string): MsgHdrs {
  const h = natsHeaders();
  h.set('x-correlation-id', correlationId);
  propagation.inject(context.active(), h, natsSetter);
  return h;
}

/**
 * Wrap a NATS subscriber handler.
 * Sets `SpanKind.CONSUMER` and extracts W3C trace context from the inbound
 * NATS headers so this span is a child of the publisher's span.
 *
 * @param subject    - NATS subject (used as span name)
 * @param msgHeaders - Inbound NATS message headers (may be undefined)
 * @param fn         - Message handler body (sync or async)
 */
export async function withConsumerSpan<T>(
  subject: string,
  msgHeaders: MsgHdrs | undefined,
  fn: (span: Span) => T | Promise<T>
): Promise<T> {
  const parentCtx = propagation.extract(context.active(), msgHeaders, natsGetter);
  return context.with(parentCtx, () =>
    withSpan(`process ${subject}`, fn, {
      kind: SpanKind.CONSUMER,
      attributes: {
        [SEMATTRS_MESSAGING_SYSTEM]:      'nats',
        [SEMATTRS_MESSAGING_DESTINATION]: subject,
        // 'process' = span covers the full message handling lifecycle.
        // 'receive' would only be correct for a span that ends when the message
        // is handed off, before any processing begins.
        [SEMATTRS_MESSAGING_OPERATION]:   MESSAGINGOPERATIONVALUES_PROCESS,
      },
    })
  );
}

/**
 * Wrap a NATS message publisher.
 * Sets `SpanKind.PRODUCER`. Call `injectTraceHeaders` inside `fn` to pass the
 * active trace context to the consumer.
 *
 * Prefer `withTracedPublish` which injects headers for you in the correct order.
 *
 * @param subject - NATS subject (used as span name)
 * @param fn      - Publish body (sync or async)
 */
export async function withProducerSpan<T>(
  subject: string,
  fn: (span: Span) => T | Promise<T>
): Promise<T> {
  return withSpan(`send ${subject}`, fn, {
    kind: SpanKind.PRODUCER,
    attributes: {
      [SEMATTRS_MESSAGING_SYSTEM]:      'nats',
      [SEMATTRS_MESSAGING_DESTINATION]: subject,
      [SEMATTRS_MESSAGING_OPERATION]:   'publish',
    },
  });
}

/**
 * Publish a NATS message inside a PRODUCER span with trace context + correlation
 * ID pre-injected — the safe, all-in-one alternative to
 * `withProducerSpan` + `injectTraceHeaders` called separately.
 *
 * Enforcement: headers are created **inside** the span so the injected W3C
 * context always contains the span ID. The consumer's `withConsumerSpan` can
 * then link back to this span automatically.
 *
 * @param subject       - NATS subject (used as span name)
 * @param correlationId - Embedded as `x-correlation-id` in the NATS headers
 * @param fn            - Publish body; receives the active span + ready headers
 *
 * @example
 * await withTracedPublish('workspace.v1.workspace-created', correlationId,
 *   async (span, headers) => {
 *     span.setAttribute('workspace.id', workspaceId);
 *     await js.publish(subject, encode(payload), { headers });
 *   }
 * );
 */
export async function withTracedPublish<T>(
  subject: string,
  correlationId: string,
  fn: (span: Span, headers: MsgHdrs) => T | Promise<T>
): Promise<T> {
  return withProducerSpan(subject, (span) => {
    // Headers injected inside the span — context contains the span ID.
    const headers = injectTraceHeaders(correlationId);
    return fn(span, headers);
  });
}
