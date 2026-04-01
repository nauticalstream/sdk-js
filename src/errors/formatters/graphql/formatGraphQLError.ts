import { GraphQLError } from 'graphql';
import { ZodError } from 'zod';
import { DomainException } from '../../base/DomainException.js';
import { SystemException } from '../../base/SystemException.js';
import { ValidationError } from '../../domain/ValidationError.js';

/**
 * Format GraphQL errors for Mercurius/Apollo Server
 * 
 * Transforms exceptions into user-friendly GraphQL errors with proper error codes.
 * - ZodError → ValidationError automatically (with structured field details)
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
export function formatGraphQLError(err: GraphQLError): GraphQLError {
  const GQLError = GraphQLError;
  let original = err.originalError;

  if (!original) {
    // GraphQL validation/syntax errors — safe to forward as-is
    return err;
  }

  // Auto-convert ZodError to ValidationError (industry standard practice)
  if (original instanceof ZodError || (original as any)?.name === 'ZodError') {
    const details = (original as ZodError).issues.map((issue: any) => ({
      path: issue.path.join('.'),
      message: issue.message,
      code: issue.code,
    }));
    original = new ValidationError('Validation failed', details);
  }

  // ValidationError - include structured validation details
  if (original instanceof ValidationError) {
    return new GQLError(original.message, {
      ...err,
      extensions: {
        ...err.extensions,
        code: original.graphqlCode,
        errorCode: original.errorCode,
        httpStatus: original.httpStatus,
        details: original.details, // Include field-specific validation errors
      },
    });
  }

  // Domain exception - use its metadata
  if (original instanceof DomainException) {
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
  if (original instanceof SystemException) {
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
