export { initTelemetry, shutdownTelemetry, getTracer, getMeter, withSpan, tracer, meter, } from './telemetry.js';
export type { TelemetryConfig, OTLPExporterConfig, InstrumentationConfig, CorrelationIdConfig, SamplingConfig, } from './config.js';
export { getCorrelationId, getTraceId, getSpanId, setCorrelationId, withCorrelationId, generateCorrelationId, getActiveSpan, } from './utils/context.js';
export { createLogger, type TelemetryLoggerOptions } from './utils/logging.js';
export { recordCounter, recordHistogram, recordGauge, createObservableGauge, startTimer, } from './utils/metrics.js';
export { fastifyTelemetry, type FastifyTelemetryOptions, } from './plugins/fastify-telemetry.plugin.js';
export { initSentry, getSentry, closeSentry, Sentry } from './sentry/index.js';
export type { SentryConfig } from './sentry/config.js';
export { DEFAULT_SENTRY_CONFIG } from './sentry/config.js';
//# sourceMappingURL=index.d.ts.map