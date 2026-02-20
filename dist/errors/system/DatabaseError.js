"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseError = void 0;
const codes_pb_1 = require("@nauticalstream/proto/error/v1/codes_pb");
const SystemException_1 = require("../base/SystemException");
/**
 * DatabaseError
 *
 * Thrown when database operations fail (connection, query, transaction).
 *
 * - Error Code: 50000 (INTERNAL_ERROR)
 * - HTTP Status: 500
 * - Severity: RETRYABLE (may succeed on retry)
 * - GraphQL Code: INTERNAL_SERVER_ERROR
 *
 * Database errors are retryable because they often represent transient failures:
 * - Connection pool exhausted
 * - Lock timeouts
 * - Temporary network issues
 * - Replica lag
 *
 * @example
 * ```typescript
 * try {
 *   await db.query('SELECT * FROM users');
 * } catch (err) {
 *   throw new DatabaseError('Failed to query users', err.message);
 * }
 * ```
 */
class DatabaseError extends SystemException_1.SystemException {
    constructor(message, originalError) {
        super(message);
        this.originalError = originalError;
        this.errorCode = codes_pb_1.ErrorCode.INTERNAL_ERROR;
    }
    toJSON() {
        return {
            ...super.toJSON(),
            originalError: this.originalError instanceof Error
                ? this.originalError.message
                : String(this.originalError),
        };
    }
}
exports.DatabaseError = DatabaseError;
//# sourceMappingURL=DatabaseError.js.map