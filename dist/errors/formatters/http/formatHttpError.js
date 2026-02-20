"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatHttpError = formatHttpError;
const telemetry_1 = require("../../../telemetry");
const DomainException_1 = require("../../base/DomainException");
const SystemException_1 = require("../../base/SystemException");
/**
 * Format errors for HTTP/REST API responses
 *
 * Transforms exceptions into structured HTTP error responses.
 * - Domain/System exceptions → structured response with proper status code
 * - Unknown errors → 500 Internal Server Error
 *
 * @example
 * ```typescript
 * import { formatHttpError } from '@nauticalstream/errors';
 *
 * fastify.setErrorHandler((error, request, reply) => {
 *   const formatted = formatHttpError(error);
 *   reply.status(formatted.statusCode).send(formatted);
 * });
 *
 * // Response:
 * // {
 * //   "statusCode": 404,
 * //   "error": "NOT_FOUND",
 * //   "message": "Conversation with id 123 not found",
 * //   "errorCode": 30000,
 * //   "correlationId": "uuid-here"
 * // }
 * ```
 */
function formatHttpError(error) {
    // Domain exception
    if (error instanceof DomainException_1.DomainException) {
        return {
            statusCode: error.httpStatus,
            error: error.graphqlCode,
            message: error.message,
            errorCode: error.errorCode,
            correlationId: (0, telemetry_1.getCorrelationId)(),
        };
    }
    // System exception
    if (error instanceof SystemException_1.SystemException) {
        return {
            statusCode: error.httpStatus,
            error: error.graphqlCode,
            message: error.message,
            errorCode: error.errorCode,
            correlationId: (0, telemetry_1.getCorrelationId)(),
        };
    }
    // Unknown error - hide details
    return {
        statusCode: 500,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred',
        correlationId: (0, telemetry_1.getCorrelationId)(),
    };
}
//# sourceMappingURL=formatHttpError.js.map