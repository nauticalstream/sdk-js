"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SystemException = void 0;
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
class SystemException extends Error {
    constructor(message) {
        super(message);
        /**
         * HTTP status code - usually 500 or 503
         */
        this.httpStatus = 500;
        /**
         * GraphQL error code - usually 'INTERNAL_SERVER_ERROR'
         */
        this.graphqlCode = 'INTERNAL_SERVER_ERROR';
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
    get isRetryable() {
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
exports.SystemException = SystemException;
//# sourceMappingURL=SystemException.js.map