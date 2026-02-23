import { NodeSDK } from '@opentelemetry/sdk-node';
import { trace, metrics, SpanKind, type Tracer, type Meter, type Span } from '@opentelemetry/api';
import type { TelemetryConfig } from './config';
import {
  mergeConfig,
  buildResource,
  buildInstrumentations,
  buildSpanProcessors,
  buildMetricReader,
  buildSampler,
  buildResourceDetectors,
} from './sdk/builders';
import { withSpan as _withSpan } from './utils/tracing';

let sdk: NodeSDK | null = null;
let isInitialized = false;

/** Initialize the OTel SDK. Call once at startup before any other code. */
export function initTelemetry(config: TelemetryConfig): void {
  if (isInitialized) {
    console.warn('Telemetry already initialized. Skipping re-initialization.');
    return;
  }

  const merged   = mergeConfig(config);
  const detectors = buildResourceDetectors(merged);
  const reader    = buildMetricReader(merged);

  sdk = new NodeSDK({
    resource:         buildResource(merged),
    instrumentations: buildInstrumentations(merged),
    spanProcessors:   buildSpanProcessors(merged),
    sampler:          buildSampler(merged),
    ...(reader     ? { metricReader:       reader     } : {}),
    ...(detectors  ? { resourceDetectors:  detectors  } : {}),
  });

  sdk.start();
  isInitialized = true;

  const msg = `OpenTelemetry initialized for ${merged.serviceName} v${merged.serviceVersion}`;
  merged.logger
    ? merged.logger.info({ serviceName: merged.serviceName }, msg)
    : console.log(msg);
}

/**
 * Flush pending spans/metrics and shut down the OTel SDK.
 */
export async function shutdownTelemetry(): Promise<void> {
  if (!sdk) return;
  try {
    await sdk.shutdown();
  } catch (error) {
    console.error('Error shutting down OpenTelemetry:', error);
  } finally {
    sdk = null;
    isInitialized = false;
  }
}

/**
 * Register SIGTERM + SIGINT handlers that flush telemetry before exit.
 * Call once at application startup — do NOT call inside `initTelemetry`.
 */
export function registerShutdownHooks(): void {
  const shutdown = async () => { await shutdownTelemetry(); };
  process.once('SIGTERM', shutdown);
  process.once('SIGINT',  shutdown);
}

/** Returns a named OTel tracer. Pass the package/module name as scope. */
export function getTracer(name = '@nauticalstream/telemetry', version?: string): Tracer {
  return trace.getTracer(name, version);
}

/** Returns a named OTel meter. Pass the package/module name as scope. */
export function getMeter(name = '@nauticalstream/telemetry', version?: string): Meter {
  return metrics.getMeter(name, version);
}

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
export async function withSpan<T>(
  name: string,
  fn: (span: Span) => T | Promise<T>,
  tracerName?: string,
  attributes?: Record<string, string | number | boolean | string[]>,
  spanKind: SpanKind = SpanKind.INTERNAL
): Promise<T> {
  return _withSpan(
    name,
    (span) => {
      if (attributes) {
        for (const [k, v] of Object.entries(attributes)) {
          // SpanAttributeValue accepts string[] as well — no narrowing cast.
          if (v != null) span.setAttribute(k, v);
        }
      }
      return fn(span);
    },
    { kind: spanKind, tracerName }
  );
}

/** Module-level tracer/meter singletons for convenience. */
export const tracer = trace.getTracer('@nauticalstream/telemetry');
export const meter  = metrics.getMeter('@nauticalstream/telemetry');
