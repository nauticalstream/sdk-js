import type { GraphQLSchema } from 'graphql';
import type { FastifyRequest } from 'fastify';
import type { DestinationStream } from 'pino';

// ────────────────────────────────────────────────────────────────────────────
// Context
// ────────────────────────────────────────────────────────────────────────────

/** Action source type for audit tracking */
export type ActionSource = 'user' | 'system';

export type HeaderValue = string | string[] | undefined;

export interface ContextHeaders extends Record<string, HeaderValue> {
  authorization?: HeaderValue;
  'x-currency'?: HeaderValue;
  'x-user-id'?: HeaderValue;
  'x-workspace-id'?: HeaderValue;
  'x-userinfo'?: HeaderValue;
  'x-access-token'?: HeaderValue;
  'x-id-token'?: HeaderValue;
}

export interface UserInfoExt {
  sub?: string;
  authenticated?: boolean;
  guest?: boolean;
  [key: string]: unknown;
}

export interface UserInfo {
  sub: string;
  client_id?: string;
  scp?: string[];
  jti?: string;
  iss?: string;
  ext?: UserInfoExt;
  iat?: number;
  nbf?: number;
  aud?: string | string[];
  exp?: number;
  [key: string]: unknown;
}

export interface IdentityContext extends Record<string, unknown> {
  sub?: string;
  userId?: string;
  workspaceId?: string;
  clientId?: string;
  client_id?: string;
  scp?: string[];
  jti?: string;
  iss?: string;
  ext?: UserInfoExt;
  iat?: number;
  nbf?: number;
  aud?: string | string[];
  exp?: number;
  authorization?: string;
  accessToken?: string;
  idToken?: string;
  rawUserInfo?: Record<string, unknown>;
  headers: ContextHeaders;
  getHeader(name: string): string | undefined;
}

/**
 * Unified context available in all services.
 * Fully enriched with computed audit fields at creation time.
 */
export interface Context {
  // ── Telemetry ──────────────────────────────────────────────────────────────
  
  /** Correlation ID for distributed tracing */
  correlationId: string;
  
  /** OpenTelemetry trace ID */
  traceId?: string;
  
  /** OpenTelemetry span ID */
  spanId?: string;
  
  /** Request ID (for HTTP/GraphQL requests) */
  requestId?: string;
  
  /** Client IP address */
  ip: string;
  
  /** User agent string */
  userAgent?: string;
  
  /** Request headers */
  headers: ContextHeaders;

  /** Normalized header accessor for propagated edge metadata */
  getHeader(name: string): string | undefined;
  
  // ── Business Identifiers ───────────────────────────────────────────────────

  /** Parsed APISIX-propagated identity and token metadata */
  identity?: IdentityContext;

  /** Convenience alias for identity subject */
  sub?: string;

  /** Convenience alias for APISIX/Hydra client ID */
  clientId?: string;

  /** Convenience alias for propagated audience claim */
  aud?: string | string[];

  /** Convenience alias for propagated issuer claim */
  iss?: string;

  /** Convenience alias for propagated token ID claim */
  jti?: string;

  /** Convenience alias for propagated scopes */
  scp?: string[];

  /** Convenience alias for propagated ext claims */
  ext?: UserInfoExt;

  /** Convenience alias for propagated issued-at */
  iat?: number;

  /** Convenience alias for propagated not-before */
  nbf?: number;

  /** Convenience alias for propagated expiry */
  exp?: number;

  /** Parsed authenticated user claims */
  user?: UserInfo;
  
  /** User ID from authentication (undefined for system actions) */
  userId?: string;
  
  /** Workspace ID */
  workspaceId?: string;

  /** Preferred ISO 4217 currency propagated from the edge */
  currency?: string;
  
  /** Tenant ID (separate from workspace, extend context to populate) */
  tenantId?: string;
  
  // ── Audit Fields (Pre-computed) ────────────────────────────────────────────
  
  /** Source of the action */
  source: ActionSource;
  
  /** Actor ID for database audit (userId or null for system) */
  actorId: string | null;
  
  /** Action source for database audit (same as source) */
  actionSource: ActionSource;
  
  /** Whether this is a user-initiated action */
  isUserAction: boolean;
  
  /** Whether this is a system-initiated action */
  isSystemAction: boolean;
  
  // ── Event Metadata (Only for event contexts) ───────────────────────────────
  
  /** Event metadata (populated for event-sourced contexts) */
  eventMetadata?: {
    /** Service that emitted the event */
    eventSource: string;
    /** Event timestamp */
    eventTimestamp: string;
    /** Event type/subject */
    eventType?: string;
  };
}

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
  /** GraphQL schema as SDL, SDL array, or executable GraphQL schema */
  schema: string | string[] | GraphQLSchema;
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
