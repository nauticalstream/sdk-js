import type { GraphQLError } from 'graphql';
/**
 * Format GraphQL errors for Mercurius/Apollo Server
 *
 * Transforms exceptions into user-friendly GraphQL errors with proper error codes.
 * - Domain/System exceptions → expose message + error code to client
 * - Unknown errors → log full details, return opaque INTERNAL_SERVER_ERROR
 *
 * @example
 * ```typescript
 * import { formatGraphQLError } from '@nauticalstream/errors';
 * import mercurius from 'mercurius';
 *
 * server.register(mercurius, {
 *   schema,
 *   resolvers,
 *   errorFormatter: formatGraphQLError,
 * });
 * ```
 */
export declare function formatGraphQLError(err: GraphQLError): GraphQLError;
//# sourceMappingURL=formatGraphQLError.d.ts.map