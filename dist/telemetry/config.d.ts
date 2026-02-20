import type { MongoDBInstrumentationConfig } from '@opentelemetry/instrumentation-mongodb';
import type { HttpInstrumentationConfig } from '@opentelemetry/instrumentation-http';
import type { DnsInstrumentationConfig } from '@opentelemetry/instrumentation-dns';
export interface OTLPExporterConfig {
    endpoint: string;
    protocol: 'http' | 'grpc';
    headers?: Record<string, string>;
}
export interface InstrumentationConfig {
    fastify?: boolean | Record<string, any>;
    mongodb?: boolean | MongoDBInstrumentationConfig;
    http?: boolean | HttpInstrumentationConfig;
    dns?: boolean | DnsInstrumentationConfig;
}
export interface CorrelationIdConfig {
    headerName?: string;
    generateIfMissing?: boolean;
}
export interface SamplingConfig {
    probability?: number;
}
export interface TelemetryConfig {
    serviceName: string;
    serviceVersion?: string;
    environment?: string;
    otlp?: OTLPExporterConfig;
    instrumentations?: InstrumentationConfig;
    correlationId?: CorrelationIdConfig;
    sampling?: SamplingConfig;
    resource?: Record<string, string>;
    consoleExporter?: boolean;
}
export declare const DEFAULT_CONFIG: Partial<TelemetryConfig>;
//# sourceMappingURL=config.d.ts.map