// Core telemetry initialization
export {
  initTelemetry,
  shutdownTelemetry,
  registerShutdownHooks,
  getTracer,
  getMeter,
  withSpan,
  tracer,
  meter,
} from './telemetry';

// Configuration types
export type {
  TelemetryConfig,
  OTLPExporterConfig,
  MetricExportConfig,
  InstrumentationConfig,
  CorrelationIdConfig,
  SamplingConfig,
  BatchProcessorConfig,
  ResourceDetectorStrategy,
} from './config';

// Context utilities
export {
  getCorrelationId,
  peekCorrelationId,
  getOrCreateCorrelationId,
  withEnsuredCorrelationId,
  getTraceId,
  getSpanId,
  setCorrelationId,
  withCorrelationId,
  generateCorrelationId,
  getActiveSpan,
  setCorrelationIdInBaggage,
  getCorrelationIdFromBaggage,
} from './utils/context';

// Logger with telemetry
export { createLogger, type TelemetryLoggerOptions } from './utils/logging';

// Metric helpers
export {
  recordCounter,
  recordHistogram,
  recordGauge,
  addUpDownCounter,
  createObservableGauge,
  startTimer,
} from './utils/metrics';

// Span helpers
export {
  withSpan as withInternalSpan,
  withServerSpan,
  withClientSpan,
  withConsumerSpan,
  withProducerSpan,
  withTracedPublish,
  injectTraceHeaders,
} from './utils/tracing';

// Sentry integration
export { initSentry, getSentry, closeSentry, Sentry } from './sentry/index';
export type { SentryConfig } from './sentry/config';
export { DEFAULT_SENTRY_CONFIG } from './sentry/config';
