/**
 * HTTP error response format
 */
export interface HttpErrorResponse {
    /**
     * HTTP status code (404, 401, 403, 400, 409, 500, etc.)
     */
    statusCode: number;
    /**
     * Error type/code (NOT_FOUND, UNAUTHORIZED, VALIDATION_ERROR, etc.)
     */
    error: string;
    /**
     * Human-readable error message
     */
    message: string;
    /**
     * Proto error code (optional, for debugging)
     */
    errorCode?: number;
    /**
     * Correlation ID for request tracing
     */
    correlationId?: string;
    /**
     * Additional error details (optional)
     */
    details?: unknown;
}
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
export declare function formatHttpError(error: unknown): HttpErrorResponse;
//# sourceMappingURL=formatHttpError.d.ts.map