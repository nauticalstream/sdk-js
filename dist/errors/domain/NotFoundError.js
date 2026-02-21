import { ErrorCode, ErrorSeverity } from '@nauticalstream/proto/error/v1/codes_pb';
import { DomainException } from '../base/DomainException';
/**
 * NotFoundError
 *
 * Thrown when a requested resource does not exist.
 *
 * - Error Code: 30000 (NOT_FOUND)
 * - HTTP Status: 404
 * - Severity: CLIENT_ERROR (non-retryable)
 * - GraphQL Code: NOT_FOUND
 *
 * @example
 * ```typescript
 * const conversation = await db.findById(id);
 * if (!conversation) {
 *   throw new NotFoundError('Conversation', id);
 * }
 * ```
 */
export class NotFoundError extends DomainException {
    resource;
    resourceId;
    errorCode = ErrorCode.NOT_FOUND;
    severity = ErrorSeverity.CLIENT_ERROR;
    httpStatus = 404;
    graphqlCode = 'NOT_FOUND';
    constructor(resource, resourceId) {
        super(`${resource} with id ${resourceId} not found`);
        this.resource = resource;
        this.resourceId = resourceId;
    }
}
//# sourceMappingURL=NotFoundError.js.map