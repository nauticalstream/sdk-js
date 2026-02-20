"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServiceUnavailableError = void 0;
const codes_pb_1 = require("@nauticalstream/proto/error/v1/codes_pb");
const SystemException_1 = require("../base/SystemException");
/**
 * ServiceUnavailableError
 *
 * Thrown when a required service or dependency is unavailable.
 *
 * - Error Code: 50001 (SERVICE_UNAVAILABLE)
 * - HTTP Status: 503
 * - Severity: RETRYABLE (service may come back online)
 * - GraphQL Code: INTERNAL_SERVER_ERROR
 *
 * Used for:
 * - External API down (payment provider, email service, etc.)
 * - Internal microservice unavailable
 * - Third-party service timeout
 *
 * @example
 * ```typescript
 * try {
 *   await paymentService.charge(amount);
 * } catch (err) {
 *   throw new ServiceUnavailableError('Payment service unavailable');
 * }
 * ```
 */
class ServiceUnavailableError extends SystemException_1.SystemException {
    constructor(message, serviceName) {
        super(message);
        this.serviceName = serviceName;
        this.errorCode = codes_pb_1.ErrorCode.SERVICE_UNAVAILABLE;
        this.httpStatus = 503;
    }
    toJSON() {
        return {
            ...super.toJSON(),
            serviceName: this.serviceName,
        };
    }
}
exports.ServiceUnavailableError = ServiceUnavailableError;
//# sourceMappingURL=ServiceUnavailableError.js.map