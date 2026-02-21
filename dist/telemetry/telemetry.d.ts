import { type Tracer, type Meter } from '@opentelemetry/api';
import type { TelemetryConfig } from './config';
/**
 * Initialize OpenTelemetry SDK with the provided configuration
 * OTel v2 optimized initialization with BatchSpanProcessor for production
 */
export declare function initTelemetry(config: TelemetryConfig): void;
/**
 * Shutdown the OpenTelemetry SDK gracefully
 */
export declare function shutdownTelemetry(): Promise<void>;
/**
 * Get the tracer for the application
 */
export declare function getTracer(name?: string): Tracer;
/**
 * Get the meter for the application
 */
export declare function getMeter(name?: string): Meter;
/**
 * Create a span with the given name and execute a function
 * OTel v2 best practice: Use context-aware span handling with error recording
 * @param name - The span name
 * @param fn - The async function to execute within the span
 * @param tracerName - Optional tracer name (defaults to 'default')
 * @param attributes - Optional span attributes to set
 */
export declare function withSpan<T>(name: string, fn: () => Promise<T>, tracerName?: string, attributes?: Record<string, any>): Promise<T>;
/**
 * Export tracer and meter directly
 */
export declare const tracer: Tracer;
export declare const meter: Meter;
//# sourceMappingURL=telemetry.d.ts.map