/**
 * Base class for all domain/business errors
 *
 * Domain exceptions are errors that occur due to business logic violations,
 * invalid input, or other expected error conditions.
 *
 * Each concrete exception must define:
 * - errorCode: Proto error code (from @nauticalstream/proto)
 * - severity: Error severity (CLIENT_ERROR, RETRYABLE, FATAL)
 * - httpStatus: HTTP status code for REST APIs
 * - graphqlCode: GraphQL error code for GraphQL APIs
 *
 * @example
 * ```typescript
 * export class NotFoundError extends DomainException {
 *   readonly errorCode = ErrorCode.NOT_FOUND;
 *   readonly severity = ErrorSeverity.CLIENT_ERROR;
 *   readonly httpStatus = 404;
 *   readonly graphqlCode = 'NOT_FOUND';
 *
 *   constructor(resource: string, id: string) {
 *     super(`${resource} with id ${id} not found`);
 *   }
 * }
 * ```
 */
export class DomainException extends Error {
    constructor(message) {
        super(message);
        this.name = this.constructor.name;
        // Maintains proper stack trace for where our error was thrown (only available on V8)
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, this.constructor);
        }
    }
    /**
     * Whether this error should be retried in async systems (JetStream, queues)
     * Derived from severity level
     */
    get isRetryable() {
        // Import at runtime to avoid circular dependency issues
        const { ErrorSeverity } = require('@nauticalstream/proto');
        return this.severity === ErrorSeverity.RETRYABLE;
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
//# sourceMappingURL=DomainException.js.map