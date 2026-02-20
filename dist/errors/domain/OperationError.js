"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OperationError = void 0;
const codes_pb_1 = require("@nauticalstream/proto/error/v1/codes_pb");
const DomainException_1 = require("../base/DomainException");
/**
 * OperationError
 *
 * Thrown when a business operation fails due to logic/state issues.
 * Different from ValidationError - operation is valid but cannot be completed.
 *
 * - Error Code: 50000 (INTERNAL_ERROR)
 * - HTTP Status: 500
 * - Severity: FATAL (non-retryable, permanent failure)
 * - GraphQL Code: OPERATION_ERROR
 *
 * @example
 * ```typescript
 * if (!canDeleteConversation(conversation)) {
 *   throw new OperationError('Cannot delete conversation with active messages');
 * }
 *
 * if (payment.status === 'completed') {
 *   throw new OperationError('Cannot refund a completed payment');
 * }
 * ```
 */
class OperationError extends DomainException_1.DomainException {
    constructor(message = 'Operation failed') {
        super(message);
        this.errorCode = codes_pb_1.ErrorCode.INTERNAL_ERROR;
        this.severity = codes_pb_1.ErrorSeverity.FATAL;
        this.httpStatus = 500;
        this.graphqlCode = 'OPERATION_ERROR';
    }
}
exports.OperationError = OperationError;
//# sourceMappingURL=OperationError.js.map