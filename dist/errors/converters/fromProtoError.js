import { ErrorCode, ErrorSeverity } from '@nauticalstream/proto/error/v1/codes_pb';
import { NotFoundError } from '../domain/NotFoundError';
import { UnauthorizedError } from '../domain/UnauthorizedError';
import { ForbiddenError } from '../domain/ForbiddenError';
import { ValidationError } from '../domain/ValidationError';
import { ConflictError } from '../domain/ConflictError';
import { OperationError } from '../domain/OperationError';
import { DatabaseError } from '../system/DatabaseError';
import { ServiceUnavailableError } from '../system/ServiceUnavailableError';
import { TimeoutError } from '../system/TimeoutError';
/**
 * Convert Proto Error message back to DomainException or SystemException
 *
 * Useful when consuming errors from other services via NATS/MQTT.
 * Allows error handling logic to work consistently whether error originated
 * locally or from another service.
 *
 * Note: Some context may be lost in conversion (e.g., stack traces, custom properties)
 *
 * @example
 * ```typescript
 * eventbus.subscribe({
 *   subject: 'error.*',
 *   handler: async (protoError: ProtoError) => {
 *     const exception = fromProtoError(protoError);
 *
 *     if (exception instanceof NotFoundError) {
 *       // Handle not found error
 *     } else if (exception.isRetryable) {
 *       // Retry the operation
 *     }
 *   },
 * });
 * ```
 */
export function fromProtoError(protoError) {
    // Map proto error code to concrete exception class
    switch (protoError.code) {
        case ErrorCode.NOT_FOUND:
            return new NotFoundError(protoError.resourceType.toString(), protoError.resourceId);
        case ErrorCode.UNAUTHORIZED:
            return new UnauthorizedError(protoError.message);
        case ErrorCode.PERMISSION_DENIED:
        case ErrorCode.NOT_PARTICIPANT:
        case ErrorCode.INSUFFICIENT_PERMISSIONS:
            return new ForbiddenError(protoError.message);
        case ErrorCode.VALIDATION_ERROR:
        case ErrorCode.INVALID_FIELD:
        case ErrorCode.MISSING_FIELD:
        case ErrorCode.CONSTRAINT_VIOLATION:
            return new ValidationError(protoError.message);
        case ErrorCode.CONFLICT:
        case ErrorCode.ALREADY_EXISTS:
        case ErrorCode.RESOURCE_DELETED:
            return new ConflictError(protoError.message);
        case ErrorCode.SERVICE_UNAVAILABLE:
            return new ServiceUnavailableError(protoError.message);
        case ErrorCode.DEADLINE_EXCEEDED:
            return new TimeoutError(protoError.message);
        case ErrorCode.INTERNAL_ERROR:
        case ErrorCode.DEPENDENCY_FAILED:
            // Check severity to determine if DatabaseError or OperationError
            if (protoError.severity === ErrorSeverity.RETRYABLE) {
                return new DatabaseError(protoError.message);
            }
            else {
                return new OperationError(protoError.message);
            }
        case ErrorCode.RATE_LIMIT_EXCEEDED:
        case ErrorCode.QUOTA_EXCEEDED:
        case ErrorCode.THROTTLED:
            // These don't have dedicated exception classes yet
            // Return generic Error for now
            return new Error(protoError.message);
        case ErrorCode.UNSPECIFIED:
        default:
            // Unknown error code - return generic Error
            return new Error(protoError.message || 'Unknown error');
    }
}
//# sourceMappingURL=fromProtoError.js.map