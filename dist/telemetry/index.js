// Core telemetry initialization
export { initTelemetry, shutdownTelemetry, registerShutdownHooks, getTracer, getMeter, withSpan, tracer, meter, } from './telemetry';
// Context utilities
export { getCorrelationId, peekCorrelationId, getOrCreateCorrelationId, withEnsuredCorrelationId, getTraceId, getSpanId, setCorrelationId, withCorrelationId, generateCorrelationId, getActiveSpan, setCorrelationIdInBaggage, getCorrelationIdFromBaggage, } from './utils/context';
// Logger with telemetry
export { createLogger } from './utils/logging';
// Metric helpers
export { recordCounter, recordHistogram, recordGauge, addUpDownCounter, createObservableGauge, startTimer, } from './utils/metrics';
// Span helpers
export { withSpan as withInternalSpan, withServerSpan, withClientSpan, withConsumerSpan, withProducerSpan, withTracedPublish, injectTraceHeaders, } from './utils/tracing';
// Service-layer span helper
export { withServiceSpan } from './utils/service';
// Sentry integration
export { initSentry, getSentry, closeSentry, Sentry } from './sentry/index';
export { DEFAULT_SENTRY_CONFIG } from './sentry/config';
//# sourceMappingURL=index.js.map