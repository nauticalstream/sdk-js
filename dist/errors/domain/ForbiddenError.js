"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ForbiddenError = void 0;
const codes_pb_1 = require("@nauticalstream/proto/error/v1/codes_pb");
const DomainException_1 = require("../base/DomainException");
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
class ForbiddenError extends DomainException_1.DomainException {
    constructor(message = 'Forbidden') {
        super(message);
        this.errorCode = codes_pb_1.ErrorCode.PERMISSION_DENIED;
        this.severity = codes_pb_1.ErrorSeverity.CLIENT_ERROR;
        this.httpStatus = 403;
        this.graphqlCode = 'FORBIDDEN';
    }
}
exports.ForbiddenError = ForbiddenError;
//# sourceMappingURL=ForbiddenError.js.map