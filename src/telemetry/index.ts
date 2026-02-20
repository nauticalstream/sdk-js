// Core telemetry initialization
export {
  initTelemetry,
  shutdownTelemetry,
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
  InstrumentationConfig,
  CorrelationIdConfig,
  SamplingConfig,
} from './config.js';

// Context utilities
export {
  getCorrelationId,
  getTraceId,
  getSpanId,
  setCorrelationId,
  withCorrelationId,
  generateCorrelationId,
  getActiveSpan,
} from './utils/context.js';

// Logger with telemetry
export { createLogger, type TelemetryLoggerOptions } from './utils/logging.js';

// Metric helpers (OTel v2 - easy metric recording)
export {
  recordCounter,
  recordHistogram,
  recordGauge,
  createObservableGauge,
  startTimer,
} from './utils/metrics.js';

// Fastify plugin
export {
  fastifyTelemetry,
  type FastifyTelemetryOptions,
} from './plugins/fastify-telemetry.plugin.js';

// Sentry integration
export { initSentry, getSentry, closeSentry, Sentry } from './sentry/index.js';
export type { SentryConfig } from './sentry/config.js';
export { DEFAULT_SENTRY_CONFIG } from './sentry/config.js';
