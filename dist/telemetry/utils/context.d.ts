import { type Span, type Context } from '@opentelemetry/api';
/**
 * Get the correlation ID from the current OpenTelemetry context.
 * Automatically generates a new correlation ID if not present.
 *
 * @returns Correlation ID (always returns a string)
 */
export declare function getCorrelationId(): string;
/**
 * Get the trace ID from the active span
 */
export declare function getTraceId(): string | undefined;
/**
 * Get the span ID from the active span
 */
export declare function getSpanId(): string | undefined;
/**
 * Set correlation ID in the OpenTelemetry context
 */
export declare function setCorrelationId(correlationId: string, ctx?: Context): Context;
/**
 * Execute a function with a specific correlation ID in context
 */
export declare function withCorrelationId<T>(correlationId: string, fn: () => Promise<T>): Promise<T>;
/**
 * Generate a new correlation ID (UUID v4)
 */
export declare function generateCorrelationId(): string;
/**
 * Get the active span
 */
export declare function getActiveSpan(): Span | undefined;
//# sourceMappingURL=context.d.ts.map