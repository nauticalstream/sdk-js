// Core telemetry initialization
export {
  initTelemetry,
  shutdownTelemetry,
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
  InstrumentationConfig,
  CorrelationIdConfig,
  SamplingConfig,
} from './config';

// Context utilities
export {
  getCorrelationId,
  getTraceId,
  getSpanId,
  setCorrelationId,
  withCorrelationId,
  generateCorrelationId,
  getActiveSpan,
} from './utils/context';

// Logger with telemetry
export { createLogger, type TelemetryLoggerOptions } from './utils/logging';

// Metric helpers (OTel v2 - easy metric recording)
export {
  recordCounter,
  recordHistogram,
  recordGauge,
  createObservableGauge,
  startTimer,
} from './utils/metrics';

// Sentry integration
export { initSentry, getSentry, closeSentry, Sentry } from './sentry/index';
export type { SentryConfig } from './sentry/config';
export { DEFAULT_SENTRY_CONFIG } from './sentry/config';
