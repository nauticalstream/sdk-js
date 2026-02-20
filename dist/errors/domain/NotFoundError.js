"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotFoundError = void 0;
const codes_pb_1 = require("@nauticalstream/proto/error/v1/codes_pb");
const DomainException_1 = require("../base/DomainException");
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
class NotFoundError extends DomainException_1.DomainException {
    constructor(resource, resourceId) {
        super(`${resource} with id ${resourceId} not found`);
        this.resource = resource;
        this.resourceId = resourceId;
        this.errorCode = codes_pb_1.ErrorCode.NOT_FOUND;
        this.severity = codes_pb_1.ErrorSeverity.CLIENT_ERROR;
        this.httpStatus = 404;
        this.graphqlCode = 'NOT_FOUND';
    }
}
exports.NotFoundError = NotFoundError;
//# sourceMappingURL=NotFoundError.js.map