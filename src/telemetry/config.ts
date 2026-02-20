import type { MongoDBInstrumentationConfig } from '@opentelemetry/instrumentation-mongodb';
import type { HttpInstrumentationConfig } from '@opentelemetry/instrumentation-http';
import type { DnsInstrumentationConfig } from '@opentelemetry/instrumentation-dns';

export interface OTLPExporterConfig {
  endpoint: string;
  protocol: 'http' | 'grpc';
  headers?: Record<string, string>;
}

export interface InstrumentationConfig {
  // Fastify instrumentation is handled by @opentelemetry/auto-instrumentations-node
  // which provides the official @fastify/otel instrumentation
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

export const DEFAULT_CONFIG: Partial<TelemetryConfig> = {
  serviceVersion: '1.0.0',
  environment: process.env.NODE_ENV || 'development',
  instrumentations: {
    fastify: true,
    mongodb: true,
    http: true,
    dns: true,
  },
  correlationId: {
    headerName: 'x-correlation-id',
    generateIfMissing: true,
  },
  sampling: {
    probability: 1.0,
  },
  consoleExporter: process.env.NODE_ENV === 'development',
};
