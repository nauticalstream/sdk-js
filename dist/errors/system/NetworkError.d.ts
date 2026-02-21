import { ErrorCode } from '@nauticalstream/proto/error/v1/codes_pb';
import { SystemException } from '../base/SystemException';
/**
 * NetworkError
 *
 * Thrown when network operations fail (HTTP requests, socket connections).
 *
 * - Error Code: 50000 (INTERNAL_ERROR)
 * - HTTP Status: 500
 * - Severity: RETRYABLE (network may recover)
 * - GraphQL Code: INTERNAL_SERVER_ERROR
 *
 * Network errors are retryable because they're typically transient:
 * - DNS resolution failures
 * - Connection refused
 * - Socket timeouts
 * - TLS handshake failures
 *
 * @example
 * ```typescript
 * try {
 *   await fetch('https://api.example.com/data');
 * } catch (err) {
 *   throw new NetworkError('Failed to fetch data from external API', err);
 * }
 * ```
 */
export declare class NetworkError extends SystemException {
    readonly originalError?: unknown | undefined;
    readonly errorCode = ErrorCode.INTERNAL_ERROR;
    constructor(message: string, originalError?: unknown | undefined);
    toJSON(): {
        originalError: string;
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
//# sourceMappingURL=NetworkError.d.ts.map