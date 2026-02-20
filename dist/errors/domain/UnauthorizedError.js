"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnauthorizedError = void 0;
const codes_pb_1 = require("@nauticalstream/proto/error/v1/codes_pb");
const DomainException_1 = require("../base/DomainException");
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
class UnauthorizedError extends DomainException_1.DomainException {
    constructor(message = 'Unauthorized') {
        super(message);
        this.errorCode = codes_pb_1.ErrorCode.UNAUTHORIZED;
        this.severity = codes_pb_1.ErrorSeverity.CLIENT_ERROR;
        this.httpStatus = 401;
        this.graphqlCode = 'UNAUTHORIZED';
    }
}
exports.UnauthorizedError = UnauthorizedError;
//# sourceMappingURL=UnauthorizedError.js.map