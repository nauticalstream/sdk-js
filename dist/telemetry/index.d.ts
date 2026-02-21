export { initTelemetry, shutdownTelemetry, getTracer, getMeter, withSpan, tracer, meter, } from './telemetry';
export type { TelemetryConfig, OTLPExporterConfig, InstrumentationConfig, CorrelationIdConfig, SamplingConfig, } from './config';
export { getCorrelationId, getTraceId, getSpanId, setCorrelationId, withCorrelationId, generateCorrelationId, getActiveSpan, } from './utils/context';
export { createLogger, type TelemetryLoggerOptions } from './utils/logging';
export { recordCounter, recordHistogram, recordGauge, createObservableGauge, startTimer, } from './utils/metrics';
export { fastifyTelemetry, type FastifyTelemetryOptions, } from './plugins/fastify-telemetry.plugin';
export { initSentry, getSentry, closeSentry, Sentry } from './sentry/index';
export type { SentryConfig } from './sentry/config';
export { DEFAULT_SENTRY_CONFIG } from './sentry/config';
//# sourceMappingURL=index.d.ts.map