export { createFastifyServer } from './factory.js';

export {
  createUserContext,
  createSystemContext,
  createContextFromEvent,
  withContext,
  getContext,
} from './context.js';

export {
  createContext,
  createContextBuilder,
} from './context/builder.js';

export { fastifyTelemetry, type FastifyTelemetryOptions } from './plugins/telemetry.plugin.js';
export { fastifyRequestLogging } from './plugins/logging.plugin.js';
export { fastifyObservability } from './plugins/observability.plugin.js';
export { fastifyCors, type FastifyCorsPluginOptions } from './plugins/cors.plugin.js';
export { createGraphQLPlugin } from './plugins/graphql.plugin.js';
export { createHealthPlugin } from './plugins/health.plugin.js';

export * from './errors/index.js';
export { fastifyErrorHandler } from './errors/error-handler.plugin.js';
export { validateBody, validateQuery, validateParams } from './errors/validation.middleware.js';
export { mapZodError, isZodError } from './errors/zod-mapper.js';

// Observability instruments — for services that want to add custom labels
export {
  httpRequestsTotal,
  httpRequestDuration,
  httpActiveRequests,
  httpErrorsTotal,
} from './observability/metrics.js';

export type {
  ActionSource,
  Context,
  ContextExtractor,
  FastifyServerOptions,
  GraphQLPluginOptions,
  HealthPluginOptions,
  HealthCheckFn,
  UserInfo,
  UserInfoExt,
} from './types.js';

export {
  DEFAULT_SERVICE_NAME,
  DEFAULT_CORRELATION_ID_HEADER,
  DEFAULT_REQUEST_LOGGING,
} from './config.js';
