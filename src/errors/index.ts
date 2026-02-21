/**
 * @nauticalstream/errors
 * 
 * Shared error handling library for Nauticalstream microservices
 * 
 * @example
 * ```typescript
 * import { 
 *   NotFoundError, 
 *   UnauthorizedError,
 *   formatGraphQLError,
 *   toProtoError 
 * } from '@nauticalstream/errors';
 * 
 * // Throw domain exceptions
 * throw new NotFoundError('Conversation', conversationId);
 * 
 * // Format GraphQL errors
 * server.register(mercurius, {
 *   schema,
 *   resolvers,
 *   errorFormatter: formatGraphQLError,
 * });
 * 
 * // Convert to Proto Error for event publishing
 * const protoError = toProtoError(error, {
 *   optimisticId: input.optimisticId,
 *   resourceType: ResourceType.CONVERSATION,
 * });
 * await mqtt.publish(`user/${userId}/errors`, protoError);
 * ```
 */

// Base classes
export { DomainException } from './base/DomainException';
export { SystemException } from './base/SystemException';

// Domain exceptions (client errors — non-retryable)
export { NotFoundError } from './domain/NotFoundError';
export { UnauthorizedError } from './domain/UnauthorizedError';
export { ForbiddenError } from './domain/ForbiddenError';
export { ValidationError } from './domain/ValidationError';
export { ConflictError } from './domain/ConflictError';
export { OperationError } from './domain/OperationError';

// System exceptions (infrastructure errors — retryable)
export { DatabaseError } from './system/DatabaseError';
export { ServiceUnavailableError } from './system/ServiceUnavailableError';
export { NetworkError } from './system/NetworkError';
export { TimeoutError } from './system/TimeoutError';

// Converters (exception ↔ proto error)
export { toProtoError, type ToProtoErrorOptions } from './converters/toProtoError';
export { fromProtoError } from './converters/fromProtoError';

// Formatters (exception → GraphQL/HTTP/JetStream)
export { formatGraphQLError } from './formatters/graphql/formatGraphQLError';
export { formatHttpError, type HttpErrorResponse } from './formatters/http/formatHttpError';
export { withErrorBoundary } from './formatters/subscriber/withErrorBoundary';

// Proto types
export { ErrorCode, ErrorSeverity, ResourceType } from '@nauticalstream/proto/error/v1/codes_pb';
