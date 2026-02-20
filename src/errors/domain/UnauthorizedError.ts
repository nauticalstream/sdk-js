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
  readonly errorCode = ErrorCode.UNAUTHORIZED;
  readonly severity = ErrorSeverity.CLIENT_ERROR;
  readonly httpStatus = 401;
  readonly graphqlCode = 'UNAUTHORIZED';

  constructor(message: string = 'Unauthorized') {
    super(message);
  }
}
