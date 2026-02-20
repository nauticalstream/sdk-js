"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NetworkError = void 0;
const codes_pb_1 = require("@nauticalstream/proto/error/v1/codes_pb");
const SystemException_1 = require("../base/SystemException");
/**
 * NetworkError
 *
 * Thrown when network operations fail (HTTP requests, socket connections).
 *
 * - Error Code: 50000 (INTERNAL_ERROR)
 * - HTTP Status: 500
 * - Severity: RETRYABLE (network may recover)
 * - GraphQL Code: INTERNAL_SERVER_ERROR
 *
 * Network errors are retryable because they're typically transient:
 * - DNS resolution failures
 * - Connection refused
 * - Socket timeouts
 * - TLS handshake failures
 *
 * @example
 * ```typescript
 * try {
 *   await fetch('https://api.example.com/data');
 * } catch (err) {
 *   throw new NetworkError('Failed to fetch data from external API', err);
 * }
 * ```
 */
class NetworkError extends SystemException_1.SystemException {
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
exports.NetworkError = NetworkError;
//# sourceMappingURL=NetworkError.js.map