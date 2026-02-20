"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCorrelationId = getCorrelationId;
exports.getTraceId = getTraceId;
exports.getSpanId = getSpanId;
exports.setCorrelationId = setCorrelationId;
exports.withCorrelationId = withCorrelationId;
exports.generateCorrelationId = generateCorrelationId;
exports.getActiveSpan = getActiveSpan;
const api_1 = require("@opentelemetry/api");
const node_crypto_1 = require("node:crypto");
const CORRELATION_ID_KEY = (0, api_1.createContextKey)('correlationId');
/**
 * Get the correlation ID from the current OpenTelemetry context.
 * Automatically generates a new correlation ID if not present.
 *
 * @returns Correlation ID (always returns a string)
 */
function getCorrelationId() {
    const ctx = api_1.context.active();
    const existingId = ctx.getValue(CORRELATION_ID_KEY);
    return existingId || generateCorrelationId();
}
/**
 * Get the trace ID from the active span
 */
function getTraceId() {
    const span = api_1.trace.getActiveSpan();
    if (!span)
        return undefined;
    const spanContext = span.spanContext();
    return spanContext.traceId;
}
/**
 * Get the span ID from the active span
 */
function getSpanId() {
    const span = api_1.trace.getActiveSpan();
    if (!span)
        return undefined;
    const spanContext = span.spanContext();
    return spanContext.spanId;
}
/**
 * Set correlation ID in the OpenTelemetry context
 */
function setCorrelationId(correlationId, ctx) {
    const activeContext = ctx || api_1.context.active();
    return activeContext.setValue(CORRELATION_ID_KEY, correlationId);
}
/**
 * Execute a function with a specific correlation ID in context
 */
async function withCorrelationId(correlationId, fn) {
    const ctx = setCorrelationId(correlationId);
    return api_1.context.with(ctx, fn);
}
/**
 * Generate a new correlation ID (UUID v4)
 */
function generateCorrelationId() {
    return (0, node_crypto_1.randomUUID)();
}
/**
 * Get the active span
 */
function getActiveSpan() {
    return api_1.trace.getActiveSpan();
}
//# sourceMappingURL=context.js.map