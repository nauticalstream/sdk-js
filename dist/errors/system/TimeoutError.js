"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TimeoutError = void 0;
const codes_pb_1 = require("@nauticalstream/proto/error/v1/codes_pb");
const SystemException_1 = require("../base/SystemException");
/**
 * TimeoutError
 *
 * Thrown when an operation exceeds its time limit.
 *
 * - Error Code: 50002 (DEADLINE_EXCEEDED)
 * - HTTP Status: 504
 * - Severity: RETRYABLE (may succeed with more time)
 * - GraphQL Code: INTERNAL_SERVER_ERROR
 *
 * Timeout errors are retryable because:
 * - System may be under temporary heavy load
 * - Retry may succeed faster
 * - Background tasks may have completed
 *
 * @example
 * ```typescript
 * const timeout = setTimeout(() => {
 *   throw new TimeoutError('Operation timed out after 30s', 30000);
 * }, 30000);
 *
 * try {
 *   await longRunningOperation();
 * } finally {
 *   clearTimeout(timeout);
 * }
 * ```
 */
class TimeoutError extends SystemException_1.SystemException {
    constructor(message, timeoutMs) {
        super(message);
        this.timeoutMs = timeoutMs;
        this.errorCode = codes_pb_1.ErrorCode.DEADLINE_EXCEEDED;
        this.httpStatus = 504;
    }
    toJSON() {
        return {
            ...super.toJSON(),
            timeoutMs: this.timeoutMs,
        };
    }
}
exports.TimeoutError = TimeoutError;
//# sourceMappingURL=TimeoutError.js.map