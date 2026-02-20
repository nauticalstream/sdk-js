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
export declare class NotFoundError extends DomainException {
    readonly resource: string;
    readonly resourceId: string;
    readonly errorCode = ErrorCode.NOT_FOUND;
    readonly severity = ErrorSeverity.CLIENT_ERROR;
    readonly httpStatus = 404;
    readonly graphqlCode = "NOT_FOUND";
    constructor(resource: string, resourceId: string);
}
//# sourceMappingURL=NotFoundError.d.ts.map