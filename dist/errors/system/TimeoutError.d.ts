import { ErrorCode } from '@nauticalstream/proto/error/v1/codes_pb';
import { SystemException } from '../base/SystemException';
/**
 * TimeoutError
 *
 * Thrown when an operation exceeds its time limit.
 *
 * - Error Code: 50002 (DEADLINE_EXCEEDED)
 * - HTTP Status: 504
 * - Severity: RETRYABLE (may succeed with more time)
 * - GraphQL Code: INTERNAL_SERVER_ERROR
 *
 * Timeout errors are retryable because:
 * - System may be under temporary heavy load
 * - Retry may succeed faster
 * - Background tasks may have completed
 *
 * @example
 * ```typescript
 * const timeout = setTimeout(() => {
 *   throw new TimeoutError('Operation timed out after 30s', 30000);
 * }, 30000);
 *
 * try {
 *   await longRunningOperation();
 * } finally {
 *   clearTimeout(timeout);
 * }
 * ```
 */
export declare class TimeoutError extends SystemException {
    readonly timeoutMs?: number | undefined;
    readonly errorCode = ErrorCode.DEADLINE_EXCEEDED;
    readonly httpStatus = 504;
    constructor(message: string, timeoutMs?: number | undefined);
    toJSON(): {
        timeoutMs: number | undefined;
        name: string;
        message: string;
        errorCode: ErrorCode;
        severity: import("@nauticalstream/proto/error/v1/codes_pb").ErrorSeverity;
        httpStatus: number;
        graphqlCode: string;
        isRetryable: boolean;
        stack: string | undefined;
    };
}
//# sourceMappingURL=TimeoutError.d.ts.map