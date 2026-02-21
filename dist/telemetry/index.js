// Core telemetry initialization
export { initTelemetry, shutdownTelemetry, getTracer, getMeter, withSpan, tracer, meter, } from './telemetry';
// Context utilities
export { getCorrelationId, getTraceId, getSpanId, setCorrelationId, withCorrelationId, generateCorrelationId, getActiveSpan, } from './utils/context';
// Logger with telemetry
export { createLogger } from './utils/logging';
// Metric helpers (OTel v2 - easy metric recording)
export { recordCounter, recordHistogram, recordGauge, createObservableGauge, startTimer, } from './utils/metrics';
// Fastify plugin
export { fastifyTelemetry, } from './plugins/fastify-telemetry.plugin';
// Sentry integration
export { initSentry, getSentry, closeSentry, Sentry } from './sentry/index';
export { DEFAULT_SENTRY_CONFIG } from './sentry/config';
//# sourceMappingURL=index.js.map