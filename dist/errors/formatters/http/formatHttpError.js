import { getCorrelationId } from '../../../telemetry';
import { DomainException } from '../../base/DomainException';
import { SystemException } from '../../base/SystemException';
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
export function formatHttpError(error) {
    // Domain exception
    if (error instanceof DomainException) {
        return {
            statusCode: error.httpStatus,
            error: error.graphqlCode,
            message: error.message,
            errorCode: error.errorCode,
            correlationId: getCorrelationId(),
        };
    }
    // System exception
    if (error instanceof SystemException) {
        return {
            statusCode: error.httpStatus,
            error: error.graphqlCode,
            message: error.message,
            errorCode: error.errorCode,
            correlationId: getCorrelationId(),
        };
    }
    // Unknown error - hide details
    return {
        statusCode: 500,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred',
        correlationId: getCorrelationId(),
    };
}
//# sourceMappingURL=formatHttpError.js.map