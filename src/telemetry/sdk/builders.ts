/**
 * Pure builder functions for OTel SDK components.
 *
 * Each function takes a fully-merged TelemetryConfig and returns a single
 * OTel construct. Keeping them separate from the SDK lifecycle (telemetry.ts)
 * makes every piece independently testable without spinning up NodeSDK.
 */

import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { RuntimeNodeInstrumentation } from '@opentelemetry/instrumentation-runtime-node';
import { OTLPTraceExporter as OTLPHttpTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { OTLPTraceExporter as OTLPGrpcTraceExporter } from '@opentelemetry/exporter-trace-otlp-grpc';
import { OTLPMetricExporter as OTLPHttpMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';
import { OTLPMetricExporter as OTLPGrpcMetricExporter } from '@opentelemetry/exporter-metrics-otlp-grpc';
import { CompressionAlgorithm } from '@opentelemetry/otlp-exporter-base';
import {
  ConsoleSpanExporter,
  BatchSpanProcessor,
  ParentBasedSampler,
  TraceIdRatioBasedSampler,
} from '@opentelemetry/sdk-trace-node';
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { resourceFromAttributes, envDetector, processDetector } from '@opentelemetry/resources';
import { containerDetector } from '@opentelemetry/resource-detector-container';
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from '@opentelemetry/semantic-conventions';
import { hostname } from 'node:os';
import type { Instrumentation } from '@opentelemetry/instrumentation';
import type { TelemetryConfig } from '../config';
import { DEFAULT_CONFIG } from '../config';

// ── Config ────────────────────────────────────────────────────────────────────

/** Deep-merge caller config with DEFAULT_CONFIG. */
export function mergeConfig(config: TelemetryConfig): TelemetryConfig {
  return {
    ...DEFAULT_CONFIG,
    ...config,
    instrumentations: { ...DEFAULT_CONFIG.instrumentations, ...config.instrumentations },
    correlationId:    { ...DEFAULT_CONFIG.correlationId,    ...config.correlationId    },
    sampling:         { ...DEFAULT_CONFIG.sampling,         ...config.sampling         },
  };
}

// ── Resource ──────────────────────────────────────────────────────────────────

/** Build an OTel Resource from service metadata + optional extra attributes. */
export function buildResource(config: TelemetryConfig) {
  return resourceFromAttributes({
    [ATTR_SERVICE_NAME]:      config.serviceName,
    // Reads from env so Grafana shows the real deployed version.
    [ATTR_SERVICE_VERSION]:   config.serviceVersion ?? process.env.npm_package_version ?? 'unknown',
    'deployment.environment': config.environment ?? 'development',
    // Distinguishes replicas in multi-pod deployments.
    'service.instance.id':    process.env.HOSTNAME ?? hostname(),
    ...config.resource,
  });
}

// ── Internal helpers ─────────────────────────────────────────────────────────

/**
 * Resolves the OTLP endpoint URL for a given signal.
 * gRPC uses bare "host:port" (no path). HTTP requires the OTel-standard path.
 */
function buildOtlpUrl(endpoint: string, protocol: 'http' | 'grpc', signalPath: string): string {
  return protocol === 'grpc' ? endpoint : `${endpoint}/${signalPath}`;
}

// ── Instrumentations ─────────────────────────────────────────────────────────

/** Build the list of OTel auto-instrumentations from config. */
export function buildInstrumentations(config: TelemetryConfig): Instrumentation[] {
  // config is expected to be a fully-merged TelemetryConfig (via mergeConfig).
  // Fall back to DEFAULT_CONFIG so callers can also pass an unmerged config.
  const inst = config.instrumentations ?? DEFAULT_CONFIG.instrumentations ?? {};

  const autoInstrumentations = getNodeAutoInstrumentations({
    // ── Web / network ──────────────────────────────────────────────────────────
    '@opentelemetry/instrumentation-fastify': {
      enabled: inst.fastify !== false,
      ...(typeof inst.fastify === 'object' ? inst.fastify : {}),
    },
    '@opentelemetry/instrumentation-http': {
      enabled: inst.http !== false,
      ...(typeof inst.http === 'object' ? inst.http : {}),
    },
    '@opentelemetry/instrumentation-dns': {
      enabled: inst.dns !== false,
      ...(typeof inst.dns === 'object' ? inst.dns : {}),
    },
    '@opentelemetry/instrumentation-grpc': {
      enabled: inst.grpc === true || typeof inst.grpc === 'object',
      ...(typeof inst.grpc === 'object' ? inst.grpc : {}),
    },
    // ── Data stores ────────────────────────────────────────────────────────────
    '@opentelemetry/instrumentation-mongodb': {
      enabled: inst.mongodb !== false,
      ...(typeof inst.mongodb === 'object' ? inst.mongodb : {}),
    },
    '@opentelemetry/instrumentation-pg': {
      enabled: inst.pg !== false,
      ...(typeof inst.pg === 'object' ? inst.pg : {}),
    },
    '@opentelemetry/instrumentation-redis-4': {
      enabled: inst.redis !== false,
      ...(typeof inst.redis === 'object' ? inst.redis : {}),
    },
    '@opentelemetry/instrumentation-ioredis': {
      enabled: inst.ioredis !== false,
      ...(typeof inst.ioredis === 'object' ? inst.ioredis : {}),
    },
    // ── Application ────────────────────────────────────────────────────────────
    '@opentelemetry/instrumentation-graphql': {
      enabled: inst.graphql === true || typeof inst.graphql === 'object',
      ...(typeof inst.graphql === 'object' ? inst.graphql : {}),
    },
    '@opentelemetry/instrumentation-pino': {
      enabled: inst.pino !== false,
      ...(typeof inst.pino === 'object' ? inst.pino : {}),
    },
  });

  const runtimeCfg = inst.runtimeMetrics;
  const runtimeEnabled = runtimeCfg !== false;

  if (!runtimeEnabled) {
    return autoInstrumentations;
  }

  const runtimeInst = new RuntimeNodeInstrumentation(
    typeof runtimeCfg === 'object' ? runtimeCfg : { monitoringPrecision: 10 },
  );

  return [...autoInstrumentations, runtimeInst];
}

// ── Span processors ───────────────────────────────────────────────────────────

/** Build OTLP + optional console BatchSpanProcessors. */
export function buildSpanProcessors(config: TelemetryConfig): BatchSpanProcessor[] {
  const processors: BatchSpanProcessor[] = [];
  const batchCfg = config.batchProcessor;

  if (config.otlp) {
    const traceUrl = buildOtlpUrl(config.otlp.endpoint, config.otlp.protocol, 'v1/traces');
    // Split gRPC/HTTP to keep types explicit — gRPC uses CompressionAlgorithm enum,
    // HTTP accepts string. Compression is a no-op for gRPC (transport-level framing).
    const traceExporter = config.otlp.protocol === 'grpc'
      ? new OTLPGrpcTraceExporter({ url: traceUrl, headers: config.otlp.headers ?? {} })
      : new OTLPHttpTraceExporter({
          url:         traceUrl,
          headers:     config.otlp.headers ?? {},
          compression: config.otlp.compression === 'gzip'
            ? CompressionAlgorithm.GZIP
            : CompressionAlgorithm.NONE,
        });
    processors.push(new BatchSpanProcessor(traceExporter, batchCfg));
  }

  if (config.consoleExporter) {
    processors.push(new BatchSpanProcessor(new ConsoleSpanExporter(), batchCfg));
  }

  return processors;
}

// ── Metric reader ─────────────────────────────────────────────────────────────

/** Build a PeriodicExportingMetricReader, or `undefined` when not configured. */
export function buildMetricReader(config: TelemetryConfig): PeriodicExportingMetricReader | undefined {
  if (!config.metricExport) return undefined;

  const metricUrl = buildOtlpUrl(config.metricExport.endpoint, config.metricExport.protocol, 'v1/metrics');

  // Split gRPC/HTTP paths to keep types explicit — same reasoning as buildSpanProcessors.
  const metricExporter = config.metricExport.protocol === 'grpc'
    ? new OTLPGrpcMetricExporter({ url: metricUrl, headers: config.metricExport.headers ?? {} })
    : new OTLPHttpMetricExporter({
        url:         metricUrl,
        headers:     config.metricExport.headers ?? {},
        compression: config.metricExport.compression === 'gzip'
          ? CompressionAlgorithm.GZIP
          : CompressionAlgorithm.NONE,
      });

  return new PeriodicExportingMetricReader({
    exporter:             metricExporter,
    exportIntervalMillis: config.metricExport.intervalMs ?? 60_000,
  });
}

// ── Sampler ───────────────────────────────────────────────────────────────────

/** Build a ParentBased(TraceIdRatio) sampler from config. */
export function buildSampler(config: TelemetryConfig): ParentBasedSampler {
  return new ParentBasedSampler({
    root: new TraceIdRatioBasedSampler(config.sampling?.probability ?? 1.0),
  });
}

// ── Resource detectors ────────────────────────────────────────────────────────

/**
 * Returns resource detectors for 'auto' strategy, or `undefined` for 'none'.
 *
 * Cast to `any[]`: sdk-node@0.55 ships resources@1.28, auto-instrumentations
 * ships resources@1.30 — `ResourceDetector.detect()` return type changed
 * between them. Runtime behaviour is identical; purely a transient type clash.
 */
export function buildResourceDetectors(config: TelemetryConfig): any[] | undefined {
  return (config.resourceDetectors ?? 'auto') === 'auto'
    ? [envDetector, processDetector, containerDetector]
    : undefined;
}
