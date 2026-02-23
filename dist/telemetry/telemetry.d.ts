import { SpanKind, type Tracer, type Meter, type Span } from '@opentelemetry/api';
import type { TelemetryConfig } from './config';
/** Initialize the OTel SDK. Call once at startup before any other code. */
export declare function initTelemetry(config: TelemetryConfig): void;
/**
 * Flush pending spans/metrics and shut down the OTel SDK.
 */
export declare function shutdownTelemetry(): Promise<void>;
/**
 * Register SIGTERM + SIGINT handlers that flush telemetry before exit.
 * Call once at application startup — do NOT call inside `initTelemetry`.
 */
export declare function registerShutdownHooks(): void;
/** Returns a named OTel tracer. Pass the package/module name as scope. */
export declare function getTracer(name?: string, version?: string): Tracer;
/** Returns a named OTel meter. Pass the package/module name as scope. */
export declare function getMeter(name?: string, version?: string): Meter;
/**
 * Execute `fn` inside a named OTel span.
 *
 * Backward-compatible positional API — delegates to the unified `withSpan`
 * from `telemetry/utils/tracing`. For new code prefer importing span helpers
 * directly from `@nauticalstream/sdk/telemetry`.
 *
 * @param name       - Span name
 * @param fn         - Callback, receives the active Span (sync or async)
 * @param tracerName - Instrumentation scope name
 * @param attributes - Span attributes set before `fn` is called
 * @param spanKind   - OTel SpanKind (defaults to INTERNAL)
 */
export declare function withSpan<T>(name: string, fn: (span: Span) => T | Promise<T>, tracerName?: string, attributes?: Record<string, string | number | boolean | string[]>, spanKind?: SpanKind): Promise<T>;
/** Module-level tracer/meter singletons for convenience. */
export declare const tracer: Tracer;
export declare const meter: Meter;
//# sourceMappingURL=telemetry.d.ts.map