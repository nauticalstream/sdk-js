export { createFastifyServer } from './factory';

export {
  createUserContext,
  createSystemContext,
  createContextFromEvent,
  withContext,
  getContext,
} from './context';

export {
  createContext,
  createContextBuilder,
} from './context/builder';

export { fastifyTelemetry, type FastifyTelemetryOptions } from './plugins/telemetry.plugin';
export { fastifyRequestLogging } from './plugins/logging.plugin';
export { fastifyObservability } from './plugins/observability.plugin';
export { fastifyCors, type FastifyCorsPluginOptions } from './plugins/cors.plugin';
export { createGraphQLPlugin } from './plugins/graphql.plugin';
export { createHealthPlugin } from './plugins/health.plugin';

export * from './errors';
export { fastifyErrorHandler } from './errors/error-handler.plugin';
export { validateBody, validateQuery, validateParams } from './errors/validation.middleware';
export { mapZodError, isZodError } from './errors/zod-mapper';

// Observability instruments — for services that want to add custom labels
export {
  httpRequestsTotal,
  httpRequestDuration,
  httpActiveRequests,
  httpErrorsTotal,
} from './observability/metrics';

export type {
  ActionSource,
  Context,
  ContextExtractor,
  FastifyServerOptions,
  GraphQLPluginOptions,
  HealthPluginOptions,
  HealthCheckFn,
} from './types';

export {
  DEFAULT_SERVICE_NAME,
  DEFAULT_CORRELATION_ID_HEADER,
  DEFAULT_REQUEST_LOGGING,
} from './config';
