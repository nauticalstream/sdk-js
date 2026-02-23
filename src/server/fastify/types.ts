import type { FastifyRequest } from 'fastify';
import type { DestinationStream } from 'pino';

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
export interface Context extends BaseContext, BusinessContext {}

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
  /**
   * Custom Pino destination stream for the logger.
   * Useful in tests to capture log output instead of writing to stdout.
   */
  destination?: DestinationStream;
  /**
   * Trust the X-Forwarded-For / X-Forwarded-Proto headers set by a reverse proxy (nginx,
   * AWS ALB, Kubernetes ingress). Enable this for any service deployed behind a load
   * balancer so that `request.ip` and `createBaseContext` record the real client IP
   * instead of the proxy's IP.
   *
   * Accepts `true` (trust all proxies), a number (trust N hops), or a string/array of
   * trusted CIDRs — passed directly to Fastify's `trustProxy` option.
   * @default false
   */
  trustProxy?: boolean | number | string | string[];
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
