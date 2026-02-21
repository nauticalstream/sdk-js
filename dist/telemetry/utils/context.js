import { context, trace, createContextKey } from '@opentelemetry/api';
import { randomUUID } from 'node:crypto';
const CORRELATION_ID_KEY = createContextKey('correlationId');
/**
 * Get the correlation ID from the current OpenTelemetry context.
 * Automatically generates a new correlation ID if not present.
 *
 * @returns Correlation ID (always returns a string)
 */
export function getCorrelationId() {
    const ctx = context.active();
    const existingId = ctx.getValue(CORRELATION_ID_KEY);
    return existingId || generateCorrelationId();
}
/**
 * Get the trace ID from the active span
 */
export function getTraceId() {
    const span = trace.getActiveSpan();
    if (!span)
        return undefined;
    const spanContext = span.spanContext();
    return spanContext.traceId;
}
/**
 * Get the span ID from the active span
 */
export function getSpanId() {
    const span = trace.getActiveSpan();
    if (!span)
        return undefined;
    const spanContext = span.spanContext();
    return spanContext.spanId;
}
/**
 * Set correlation ID in the OpenTelemetry context
 */
export function setCorrelationId(correlationId, ctx) {
    const activeContext = ctx || context.active();
    return activeContext.setValue(CORRELATION_ID_KEY, correlationId);
}
/**
 * Execute a function with a specific correlation ID in context
 */
export async function withCorrelationId(correlationId, fn) {
    const ctx = setCorrelationId(correlationId);
    return context.with(ctx, fn);
}
/**
 * Generate a new correlation ID (UUID v4)
 */
export function generateCorrelationId() {
    return randomUUID();
}
/**
 * Get the active span
 */
export function getActiveSpan() {
    return trace.getActiveSpan();
}
//# sourceMappingURL=context.js.map