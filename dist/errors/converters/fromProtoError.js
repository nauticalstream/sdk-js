"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fromProtoError = fromProtoError;
const codes_pb_1 = require("@nauticalstream/proto/error/v1/codes_pb");
const NotFoundError_1 = require("../domain/NotFoundError");
const UnauthorizedError_1 = require("../domain/UnauthorizedError");
const ForbiddenError_1 = require("../domain/ForbiddenError");
const ValidationError_1 = require("../domain/ValidationError");
const ConflictError_1 = require("../domain/ConflictError");
const OperationError_1 = require("../domain/OperationError");
const DatabaseError_1 = require("../system/DatabaseError");
const ServiceUnavailableError_1 = require("../system/ServiceUnavailableError");
const TimeoutError_1 = require("../system/TimeoutError");
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
function fromProtoError(protoError) {
    // Map proto error code to concrete exception class
    switch (protoError.code) {
        case codes_pb_1.ErrorCode.NOT_FOUND:
            return new NotFoundError_1.NotFoundError(protoError.resourceType.toString(), protoError.resourceId);
        case codes_pb_1.ErrorCode.UNAUTHORIZED:
            return new UnauthorizedError_1.UnauthorizedError(protoError.message);
        case codes_pb_1.ErrorCode.PERMISSION_DENIED:
        case codes_pb_1.ErrorCode.NOT_PARTICIPANT:
        case codes_pb_1.ErrorCode.INSUFFICIENT_PERMISSIONS:
            return new ForbiddenError_1.ForbiddenError(protoError.message);
        case codes_pb_1.ErrorCode.VALIDATION_ERROR:
        case codes_pb_1.ErrorCode.INVALID_FIELD:
        case codes_pb_1.ErrorCode.MISSING_FIELD:
        case codes_pb_1.ErrorCode.CONSTRAINT_VIOLATION:
            return new ValidationError_1.ValidationError(protoError.message);
        case codes_pb_1.ErrorCode.CONFLICT:
        case codes_pb_1.ErrorCode.ALREADY_EXISTS:
        case codes_pb_1.ErrorCode.RESOURCE_DELETED:
            return new ConflictError_1.ConflictError(protoError.message);
        case codes_pb_1.ErrorCode.SERVICE_UNAVAILABLE:
            return new ServiceUnavailableError_1.ServiceUnavailableError(protoError.message);
        case codes_pb_1.ErrorCode.DEADLINE_EXCEEDED:
            return new TimeoutError_1.TimeoutError(protoError.message);
        case codes_pb_1.ErrorCode.INTERNAL_ERROR:
        case codes_pb_1.ErrorCode.DEPENDENCY_FAILED:
            // Check severity to determine if DatabaseError or OperationError
            if (protoError.severity === codes_pb_1.ErrorSeverity.RETRYABLE) {
                return new DatabaseError_1.DatabaseError(protoError.message);
            }
            else {
                return new OperationError_1.OperationError(protoError.message);
            }
        case codes_pb_1.ErrorCode.RATE_LIMIT_EXCEEDED:
        case codes_pb_1.ErrorCode.QUOTA_EXCEEDED:
        case codes_pb_1.ErrorCode.THROTTLED:
            // These don't have dedicated exception classes yet
            // Return generic Error for now
            return new Error(protoError.message);
        case codes_pb_1.ErrorCode.UNSPECIFIED:
        default:
            // Unknown error code - return generic Error
            return new Error(protoError.message || 'Unknown error');
    }
}
//# sourceMappingURL=fromProtoError.js.map