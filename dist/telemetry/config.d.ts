import type { MongoDBInstrumentationConfig } from '@opentelemetry/instrumentation-mongodb';
import type { HttpInstrumentationConfig } from '@opentelemetry/instrumentation-http';
import type { DnsInstrumentationConfig } from '@opentelemetry/instrumentation-dns';
import type { Logger } from 'pino';
export interface OTLPExporterConfig {
    endpoint: string;
    protocol: 'http' | 'grpc';
    headers?: Record<string, string>;
    /**
     * GZIP-compress trace payloads before sending. HTTP only — no effect with gRPC.
     * Reduces payload size by ~60-80% for large spans. Default: 'none'.
     */
    compression?: 'gzip' | 'none';
}
/**
 * Metric export configuration.
 * If omitted, metrics are collected but not exported to any backend.
 */
export interface MetricExportConfig {
    /** OTLP endpoint, e.g. 'http://localhost:4318' */
    endpoint: string;
    protocol: 'http' | 'grpc';
    headers?: Record<string, string>;
    /** Export interval in milliseconds. Default: 60 000 (1 min). */
    intervalMs?: number;
    /**
     * GZIP-compress metric payloads before sending. HTTP only — no effect with gRPC.
     * Default: 'none'.
     */
    compression?: 'gzip' | 'none';
}
/**
 * BatchSpanProcessor tuning.
 *
 * The SDK defaults (maxQueueSize: 2048, scheduledDelayMillis: 5000) silently
 * drop spans at ~500 spans/sec. Tune these for high-throughput services.
 *
 * @example High-throughput service (>500 spans/sec):
 * batchProcessor: { maxQueueSize: 8192, maxExportBatchSize: 1024, scheduledDelayMillis: 1000 }
 */
export interface BatchProcessorConfig {
    /** Max spans in the in-memory queue before drops begin. Default: 2048. */
    maxQueueSize?: number;
    /** Max spans per export batch. Must be ≤ maxQueueSize. Default: 512. */
    maxExportBatchSize?: number;
    /** Delay between scheduled export flushes in ms. Default: 5000. */
    scheduledDelayMillis?: number;
    /** Timeout for a single export attempt in ms. Default: 30000. */
    exportTimeoutMillis?: number;
}
export interface InstrumentationConfig {
    fastify?: boolean | Record<string, any>;
    http?: boolean | HttpInstrumentationConfig;
    dns?: boolean | DnsInstrumentationConfig;
    grpc?: boolean | Record<string, any>;
    mongodb?: boolean | MongoDBInstrumentationConfig;
    pg?: boolean | Record<string, any>;
    redis?: boolean | Record<string, any>;
    ioredis?: boolean | Record<string, any>;
    graphql?: boolean | Record<string, any>;
    pino?: boolean | Record<string, any>;
}
export interface CorrelationIdConfig {
    headerName?: string;
    generateIfMissing?: boolean;
}
export interface SamplingConfig {
    probability?: number;
}
/**
 * Resource detector strategy.
 *
 * - 'auto'  (default) — runs envDetector + processDetector + containerDetector.
 * - 'none'  — skip all detectors; use only manually supplied resource attributes.
 */
export type ResourceDetectorStrategy = 'auto' | 'none';
export interface TelemetryConfig {
    serviceName: string;
    /**
     * Service version. Defaults to process.env.npm_package_version so Grafana
     * reflects the real deployed version rather than a hard-coded string.
     */
    serviceVersion?: string;
    environment?: string;
    /** Trace exporter (OTLP). */
    otlp?: OTLPExporterConfig;
    /** Metric exporter (OTLP). When omitted, metrics are not exported. */
    metricExport?: MetricExportConfig;
    consoleExporter?: boolean;
    instrumentations?: InstrumentationConfig;
    resource?: Record<string, string>;
    /**
     * Resource detector strategy. Defaults to 'auto' (process, env, container).
     * Set to 'none' in tests or environments where detectors are unsuitable.
     */
    resourceDetectors?: ResourceDetectorStrategy;
    /**
     * BatchSpanProcessor tuning. Increase maxQueueSize / reduce scheduledDelayMillis
     * for high-throughput services (>200 spans/sec) to avoid silent span drops.
     */
    batchProcessor?: BatchProcessorConfig;
    correlationId?: CorrelationIdConfig;
    sampling?: SamplingConfig;
    /**
     * Structured logger used for SDK lifecycle messages (init, shutdown, errors).
     * Falls back to console when omitted.
     * Pass a Pino logger: `logger: pinoInstance.child({ component: 'otel' })`
     */
    logger?: Pick<Logger, 'info' | 'warn' | 'error'>;
}
export declare const DEFAULT_CONFIG: Partial<TelemetryConfig>;
//# sourceMappingURL=config.d.ts.map