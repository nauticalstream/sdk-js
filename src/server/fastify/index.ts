export { createFastifyServer } from './factory';

export {
  createBaseContext,
  extractBusinessContext,
  createContext,
  createContextBuilder,
} from './context';

export { fastifyTelemetry, type FastifyTelemetryOptions } from './plugins/telemetry.plugin';
export { fastifyRequestLogging } from './plugins/logging.plugin';
export { createGraphQLPlugin } from './plugins/graphql.plugin';
export { createHealthPlugin } from './plugins/health.plugin';

export * from './errors';

export type {
  BaseContext,
  BusinessContext,
  Context,
  ContextExtractor,
  FastifyServerOptions,
  GraphQLPluginOptions,
  HealthPluginOptions,
  HealthCheckFn,
} from './types';
