import type { ErrorCode, ErrorSeverity } from '@nauticalstream/proto/error/v1/codes_pb';

/**
 * Base class for system/infrastructure errors
 * 
 * System exceptions represent infrastructure or external service failures:
 * - Database connection failures
 * - Network timeouts
 * - Service unavailability
 * - Third-party API errors
 * 
 * System exceptions are ALWAYS retryable by default, as they represent
 * transient failures that may succeed on retry.
 * 
 * @example
 * ```typescript
 * export class DatabaseError extends SystemException {
 *   readonly errorCode = ErrorCode.INTERNAL_ERROR;
 *   
 *   constructor(message: string, public readonly query?: string) {
 *     super(message);
 *   }
 * }
 * ```
 */
export abstract class SystemException extends Error {
  /**
   * Proto error code for cross-service consistency
   * Usually ErrorCode.INTERNAL_ERROR or ErrorCode.SERVICE_UNAVAILABLE
   */
  abstract readonly errorCode: ErrorCode;

  /**
   * System exceptions are always RETRYABLE by default
   * Infrastructure failures are typically transient
   */
  readonly severity: ErrorSeverity;

  /**
   * HTTP status code - usually 500 or 503
   */
  readonly httpStatus: number = 500;

  /**
   * GraphQL error code - usually 'INTERNAL_SERVER_ERROR'
   */
  readonly graphqlCode: string = 'INTERNAL_SERVER_ERROR';

  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
    
    // Set severity to RETRYABLE (import at runtime to avoid circular deps)
    const { ErrorSeverity } = require('@nauticalstream/proto');
    this.severity = ErrorSeverity.RETRYABLE;
    
    // Maintains proper stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  /**
   * System exceptions are always retryable
   */
  get isRetryable(): boolean {
    return true;
  }

  /**
   * Convert to plain object for logging
   */
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      errorCode: this.errorCode,
      severity: this.severity,
      httpStatus: this.httpStatus,
      graphqlCode: this.graphqlCode,
      isRetryable: this.isRetryable,
      stack: this.stack,
    };
  }
}
