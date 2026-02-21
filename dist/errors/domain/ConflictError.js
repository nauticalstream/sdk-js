import { ErrorCode, ErrorSeverity } from '@nauticalstream/proto/error/v1/codes_pb';
import { DomainException } from '../base/DomainException';
/**
 * ConflictError
 *
 * Thrown when an operation conflicts with existing data or state.
 *
 * - Error Code: 30002 (CONFLICT)
 * - HTTP Status: 409
 * - Severity: CLIENT_ERROR (non-retryable)
 * - GraphQL Code: CONFLICT
 *
 * @example
 * ```typescript
 * const existing = await db.findByEmail(email);
 * if (existing) {
 *   throw new ConflictError('User with this email already exists');
 * }
 *
 * const booking = await db.findOverlapping(startDate, endDate);
 * if (booking) {
 *   throw new ConflictError('Booking already exists for this time slot');
 * }
 * ```
 */
export class ConflictError extends DomainException {
    errorCode = ErrorCode.CONFLICT;
    severity = ErrorSeverity.CLIENT_ERROR;
    httpStatus = 409;
    graphqlCode = 'CONFLICT';
    constructor(message) {
        super(message);
    }
}
//# sourceMappingURL=ConflictError.js.map