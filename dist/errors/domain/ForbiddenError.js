import { ErrorCode, ErrorSeverity } from '@nauticalstream/proto/error/v1/codes_pb';
import { DomainException } from '../base/DomainException';
/**
 * ForbiddenError
 *
 * Thrown when a user is authenticated but lacks permission for the requested action.
 *
 * - Error Code: 20001 (PERMISSION_DENIED)
 * - HTTP Status: 403
 * - Severity: CLIENT_ERROR (non-retryable)
 * - GraphQL Code: FORBIDDEN
 *
 * @example
 * ```typescript
 * if (user.role !== 'admin') {
 *   throw new ForbiddenError('Only admins can delete conversations');
 * }
 *
 * if (!canAccessWorkspace(userId, workspaceId)) {
 *   throw new ForbiddenError('You do not have access to this workspace');
 * }
 * ```
 */
export class ForbiddenError extends DomainException {
    errorCode = ErrorCode.PERMISSION_DENIED;
    severity = ErrorSeverity.CLIENT_ERROR;
    httpStatus = 403;
    graphqlCode = 'FORBIDDEN';
    constructor(message = 'Forbidden') {
        super(message);
    }
}
//# sourceMappingURL=ForbiddenError.js.map