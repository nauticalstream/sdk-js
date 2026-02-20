"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConflictError = void 0;
const codes_pb_1 = require("@nauticalstream/proto/error/v1/codes_pb");
const DomainException_1 = require("../base/DomainException");
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
class ConflictError extends DomainException_1.DomainException {
    constructor(message) {
        super(message);
        this.errorCode = codes_pb_1.ErrorCode.CONFLICT;
        this.severity = codes_pb_1.ErrorSeverity.CLIENT_ERROR;
        this.httpStatus = 409;
        this.graphqlCode = 'CONFLICT';
    }
}
exports.ConflictError = ConflictError;
//# sourceMappingURL=ConflictError.js.map