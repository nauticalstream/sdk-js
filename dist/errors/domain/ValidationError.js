"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidationError = void 0;
const codes_pb_1 = require("@nauticalstream/proto/error/v1/codes_pb");
const DomainException_1 = require("../base/DomainException");
/**
 * ValidationError
 *
 * Thrown when input data fails validation (schema, business rules, constraints).
 *
 * - Error Code: 10000 (VALIDATION_ERROR)
 * - HTTP Status: 400
 * - Severity: CLIENT_ERROR (non-retryable)
 * - GraphQL Code: VALIDATION_ERROR
 *
 * @example
 * ```typescript
 * const result = schema.safeParse(input);
 * if (!result.success) {
 *   const errors = result.error.issues.map(i => i.message).join(', ');
 *   throw new ValidationError(errors);
 * }
 *
 * if (input.startDate > input.endDate) {
 *   throw new ValidationError('Start date must be before end date');
 * }
 * ```
 */
class ValidationError extends DomainException_1.DomainException {
    constructor(message) {
        super(message);
        this.errorCode = codes_pb_1.ErrorCode.VALIDATION_ERROR;
        this.severity = codes_pb_1.ErrorSeverity.CLIENT_ERROR;
        this.httpStatus = 400;
        this.graphqlCode = 'VALIDATION_ERROR';
    }
}
exports.ValidationError = ValidationError;
//# sourceMappingURL=ValidationError.js.map