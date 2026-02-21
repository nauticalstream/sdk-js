import type { FastifyRequest } from 'fastify';

/** Telemetry fields attached to every request context */
export interface BaseContext {
  correlationId: string;
  traceId?: string;
  spanId?: string;
  ip: string;
  userAgent?: string;
  headers: Record<string, string | string[] | undefined>;
}

/** Business identifiers extracted from standard headers */
export interface BusinessContext {
  userId?: string;
  workspaceId?: string;
}

/** Combined telemetry + business context available in all services */
export interface UniversalContext extends BaseContext, BusinessContext {}

/** Function that extracts custom context fields from a request */
export type ContextExtractor<T extends object> = (request: FastifyRequest) => T;

export interface FastifyServerOptions {
  /** Service name for logger identification. @default 'fastify' */
  serviceName?: string;
  /** Enable request/response logging. @default true */
  requestLogging?: boolean;
  /** Enable CORS. Pass `true` for defaults or a config object. */
  cors?: boolean | {
    origin: string | string[] | boolean;
    credentials?: boolean;
  };
}

export interface GraphQLPluginOptions {
  /** GraphQL schema as SDL string */
  schema: string;
  /** GraphQL resolvers */
  resolvers: any;
  /** Context builder function */
  context: (request: FastifyRequest) => any;
  /** Enable GraphiQL playground. @default false */
  graphiql?: boolean;
  /** GraphQL endpoint path. @default '/graphql' */
  path?: string;
}

/** Returns `true` if healthy, throws if unhealthy */
export type HealthCheckFn = () => Promise<boolean> | boolean;

export interface HealthPluginOptions {
  /** Service name */
  serviceName: string;
  /** Service version */
  version: string;
  /** Map of system name to health check function */
  checks: Record<string, HealthCheckFn>;
  /** Health endpoint path. @default '/health' */
  path?: string;
}
