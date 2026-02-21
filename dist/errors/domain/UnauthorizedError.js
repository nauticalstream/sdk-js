import { ErrorCode, ErrorSeverity } from '@nauticalstream/proto/error/v1/codes_pb';
import { DomainException } from '../base/DomainException';
/**
 * UnauthorizedError
 *
 * Thrown when a user is not authenticated or authentication has failed.
 *
 * - Error Code: 20000 (UNAUTHORIZED)
 * - HTTP Status: 401
 * - Severity: CLIENT_ERROR (non-retryable)
 * - GraphQL Code: UNAUTHORIZED
 *
 * @example
 * ```typescript
 * if (!userId) {
 *   throw new UnauthorizedError('User not authenticated');
 * }
 *
 * if (!isValidToken(token)) {
 *   throw new UnauthorizedError('Invalid authentication token');
 * }
 * ```
 */
export class UnauthorizedError extends DomainException {
    errorCode = ErrorCode.UNAUTHORIZED;
    severity = ErrorSeverity.CLIENT_ERROR;
    httpStatus = 401;
    graphqlCode = 'UNAUTHORIZED';
    constructor(message = 'Unauthorized') {
        super(message);
    }
}
//# sourceMappingURL=UnauthorizedError.js.map