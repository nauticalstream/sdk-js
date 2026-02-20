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
export declare abstract class SystemException extends Error {
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
    readonly httpStatus: number;
    /**
     * GraphQL error code - usually 'INTERNAL_SERVER_ERROR'
     */
    readonly graphqlCode: string;
    constructor(message: string);
    /**
     * System exceptions are always retryable
     */
    get isRetryable(): boolean;
    /**
     * Convert to plain object for logging
     */
    toJSON(): {
        name: string;
        message: string;
        errorCode: ErrorCode;
        severity: ErrorSeverity;
        httpStatus: number;
        graphqlCode: string;
        isRetryable: boolean;
        stack: string | undefined;
    };
}
//# sourceMappingURL=SystemException.d.ts.map