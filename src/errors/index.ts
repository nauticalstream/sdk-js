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
export { DomainException } from './base/DomainException.js';
export { SystemException } from './base/SystemException.js';

// Domain exceptions (client errors — non-retryable)
export { NotFoundError } from './domain/NotFoundError.js';
export { UnauthorizedError } from './domain/UnauthorizedError.js';
export { ForbiddenError } from './domain/ForbiddenError.js';
export { ValidationError } from './domain/ValidationError.js';
export { ConflictError } from './domain/ConflictError.js';
export { OperationError } from './domain/OperationError.js';

// System exceptions (infrastructure errors — retryable)
export { DatabaseError } from './system/DatabaseError.js';
export { ServiceUnavailableError } from './system/ServiceUnavailableError.js';
export { NetworkError } from './system/NetworkError.js';
export { TimeoutError } from './system/TimeoutError.js';

// Converters (exception ↔ proto error)
export { toProtoError, type ToProtoErrorOptions } from './converters/toProtoError.js';
export { fromProtoError } from './converters/fromProtoError.js';

// Formatters (exception → GraphQL/HTTP/JetStream)
export { formatGraphQLError } from './formatters/graphql/formatGraphQLError.js';
export { formatHttpError, type HttpErrorResponse } from './formatters/http/formatHttpError.js';
export { withErrorBoundary } from './formatters/subscriber/withErrorBoundary.js';

// Proto types
export { ErrorCode, ErrorSeverity, ResourceType } from '@nauticalstream/proto/error/v1/codes_pb';
