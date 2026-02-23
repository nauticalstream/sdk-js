export { initTelemetry, shutdownTelemetry, registerShutdownHooks, getTracer, getMeter, withSpan, tracer, meter, } from './telemetry';
export type { TelemetryConfig, OTLPExporterConfig, MetricExportConfig, InstrumentationConfig, CorrelationIdConfig, SamplingConfig, BatchProcessorConfig, ResourceDetectorStrategy, } from './config';
export { getCorrelationId, peekCorrelationId, getOrCreateCorrelationId, withEnsuredCorrelationId, getTraceId, getSpanId, setCorrelationId, withCorrelationId, generateCorrelationId, getActiveSpan, setCorrelationIdInBaggage, getCorrelationIdFromBaggage, } from './utils/context';
export { createLogger, type TelemetryLoggerOptions } from './utils/logging';
export { recordCounter, recordHistogram, recordGauge, addUpDownCounter, createObservableGauge, startTimer, } from './utils/metrics';
export { withSpan as withInternalSpan, withServerSpan, withClientSpan, withConsumerSpan, withProducerSpan, withTracedPublish, injectTraceHeaders, } from './utils/tracing';
export { initSentry, getSentry, closeSentry, Sentry } from './sentry/index';
export type { SentryConfig } from './sentry/config';
export { DEFAULT_SENTRY_CONFIG } from './sentry/config';
//# sourceMappingURL=index.d.ts.map