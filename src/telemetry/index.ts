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
} from './telemetry.js';

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
} from './config.js';

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
} from './utils/context.js';

// Logger with telemetry
export { createLogger, type TelemetryLoggerOptions } from './utils/logging.js';

// Metric helpers
export {
  recordCounter,
  recordHistogram,
  recordGauge,
  addUpDownCounter,
  createObservableGauge,
  startTimer,
} from './utils/metrics.js';

// Span helpers
export {
  withSpan as withInternalSpan,
  withServerSpan,
  withClientSpan,
  withConsumerSpan,
  withProducerSpan,
  withTracedPublish,
  injectTraceHeaders,
} from './utils/tracing.js';

// Service-layer span helper
export { withServiceSpan, type ServiceSpanContext } from './utils/service.js';

// Sentry integration
export { initSentry, getSentry, closeSentry, Sentry } from './sentry/index.js';
export type { SentryConfig } from './sentry/config.js';
export { DEFAULT_SENTRY_CONFIG } from './sentry/config.js';
