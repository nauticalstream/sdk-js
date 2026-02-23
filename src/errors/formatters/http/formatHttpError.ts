import { getCorrelationId } from '../../../telemetry';
import { DomainException } from '../../base/DomainException';
import { SystemException } from '../../base/SystemException';

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
   * Additional error details (optional, e.g., validation field errors)
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
export function formatHttpError(error: unknown): HttpErrorResponse {
  // Domain exception
  if (error instanceof DomainException) {
    return {
      statusCode: error.httpStatus,
      error: error.graphqlCode,
      message: error.message,
      errorCode: error.errorCode,
      correlationId: getCorrelationId(),
      details: (error as any).details, // Include validation details if present
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
