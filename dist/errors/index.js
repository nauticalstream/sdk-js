"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResourceType = exports.ErrorSeverity = exports.ErrorCode = exports.withErrorBoundary = exports.formatHttpError = exports.formatGraphQLError = exports.fromProtoError = exports.toProtoError = exports.TimeoutError = exports.NetworkError = exports.ServiceUnavailableError = exports.DatabaseError = exports.OperationError = exports.ConflictError = exports.ValidationError = exports.ForbiddenError = exports.UnauthorizedError = exports.NotFoundError = exports.SystemException = exports.DomainException = void 0;
// ============================================================================
// Base Classes
// ============================================================================
var DomainException_1 = require("./base/DomainException");
Object.defineProperty(exports, "DomainException", { enumerable: true, get: function () { return DomainException_1.DomainException; } });
var SystemException_1 = require("./base/SystemException");
Object.defineProperty(exports, "SystemException", { enumerable: true, get: function () { return SystemException_1.SystemException; } });
// ============================================================================
// Domain Exceptions (Client Errors - Non-Retryable)
// ============================================================================
var NotFoundError_1 = require("./domain/NotFoundError");
Object.defineProperty(exports, "NotFoundError", { enumerable: true, get: function () { return NotFoundError_1.NotFoundError; } });
var UnauthorizedError_1 = require("./domain/UnauthorizedError");
Object.defineProperty(exports, "UnauthorizedError", { enumerable: true, get: function () { return UnauthorizedError_1.UnauthorizedError; } });
var ForbiddenError_1 = require("./domain/ForbiddenError");
Object.defineProperty(exports, "ForbiddenError", { enumerable: true, get: function () { return ForbiddenError_1.ForbiddenError; } });
var ValidationError_1 = require("./domain/ValidationError");
Object.defineProperty(exports, "ValidationError", { enumerable: true, get: function () { return ValidationError_1.ValidationError; } });
var ConflictError_1 = require("./domain/ConflictError");
Object.defineProperty(exports, "ConflictError", { enumerable: true, get: function () { return ConflictError_1.ConflictError; } });
var OperationError_1 = require("./domain/OperationError");
Object.defineProperty(exports, "OperationError", { enumerable: true, get: function () { return OperationError_1.OperationError; } });
// ============================================================================
// System Exceptions (Infrastructure Errors - Retryable)
// ============================================================================
var DatabaseError_1 = require("./system/DatabaseError");
Object.defineProperty(exports, "DatabaseError", { enumerable: true, get: function () { return DatabaseError_1.DatabaseError; } });
var ServiceUnavailableError_1 = require("./system/ServiceUnavailableError");
Object.defineProperty(exports, "ServiceUnavailableError", { enumerable: true, get: function () { return ServiceUnavailableError_1.ServiceUnavailableError; } });
var NetworkError_1 = require("./system/NetworkError");
Object.defineProperty(exports, "NetworkError", { enumerable: true, get: function () { return NetworkError_1.NetworkError; } });
var TimeoutError_1 = require("./system/TimeoutError");
Object.defineProperty(exports, "TimeoutError", { enumerable: true, get: function () { return TimeoutError_1.TimeoutError; } });
// ============================================================================
// Converters (Exception ↔ Proto Error)
// ============================================================================
var toProtoError_1 = require("./converters/toProtoError");
Object.defineProperty(exports, "toProtoError", { enumerable: true, get: function () { return toProtoError_1.toProtoError; } });
var fromProtoError_1 = require("./converters/fromProtoError");
Object.defineProperty(exports, "fromProtoError", { enumerable: true, get: function () { return fromProtoError_1.fromProtoError; } });
// ============================================================================
// Formatters (Exception → GraphQL/HTTP/JetStream)
// ============================================================================
var formatGraphQLError_1 = require("./formatters/graphql/formatGraphQLError");
Object.defineProperty(exports, "formatGraphQLError", { enumerable: true, get: function () { return formatGraphQLError_1.formatGraphQLError; } });
var formatHttpError_1 = require("./formatters/http/formatHttpError");
Object.defineProperty(exports, "formatHttpError", { enumerable: true, get: function () { return formatHttpError_1.formatHttpError; } });
var withErrorBoundary_1 = require("./formatters/subscriber/withErrorBoundary");
Object.defineProperty(exports, "withErrorBoundary", { enumerable: true, get: function () { return withErrorBoundary_1.withErrorBoundary; } });
// ============================================================================
// Re-export Proto Types for Convenience
// ============================================================================
var codes_pb_1 = require("@nauticalstream/proto/error/v1/codes_pb");
Object.defineProperty(exports, "ErrorCode", { enumerable: true, get: function () { return codes_pb_1.ErrorCode; } });
Object.defineProperty(exports, "ErrorSeverity", { enumerable: true, get: function () { return codes_pb_1.ErrorSeverity; } });
Object.defineProperty(exports, "ResourceType", { enumerable: true, get: function () { return codes_pb_1.ResourceType; } });
//# sourceMappingURL=index.js.map