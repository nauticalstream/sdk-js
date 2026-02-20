"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatGraphQLError = formatGraphQLError;
const DomainException_1 = require("../../base/DomainException");
const SystemException_1 = require("../../base/SystemException");
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
function formatGraphQLError(err) {
    // Import GraphQLError at runtime to avoid peer dependency issues
    const { GraphQLError: GQLError } = require('graphql');
    const original = err.originalError;
    if (!original) {
        // GraphQL validation/syntax errors — safe to forward as-is
        return err;
    }
    // Domain exception - use its metadata
    if (original instanceof DomainException_1.DomainException) {
        return new GQLError(original.message, {
            ...err,
            extensions: {
                ...err.extensions,
                code: original.graphqlCode,
                errorCode: original.errorCode,
                httpStatus: original.httpStatus,
            },
        });
    }
    // System exception - use its metadata
    if (original instanceof SystemException_1.SystemException) {
        return new GQLError(original.message, {
            ...err,
            extensions: {
                ...err.extensions,
                code: original.graphqlCode,
                errorCode: original.errorCode,
                httpStatus: original.httpStatus,
            },
        });
    }
    // Unexpected error — hide internals from client
    return new GQLError('Internal server error', {
        extensions: {
            code: 'INTERNAL_SERVER_ERROR',
        },
    });
}
//# sourceMappingURL=formatGraphQLError.js.map