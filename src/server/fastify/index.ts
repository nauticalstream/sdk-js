export { createFastifyServer } from './factory';

export {
  createBaseContext,
  extractBusinessContext,
  createUniversalContext,
  createContextBuilder,
} from './context';

export { fastifyTelemetry, type FastifyTelemetryOptions } from './plugins/telemetry.plugin';
export { createGraphQLPlugin } from './plugins/graphql.plugin';
export { createHealthPlugin } from './plugins/health.plugin';

export * from './errors';

export type {
  BaseContext,
  BusinessContext,
  UniversalContext,
  ContextExtractor,
  FastifyServerOptions,
  GraphQLPluginOptions,
  HealthPluginOptions,
  HealthCheckFn,
} from './types';
