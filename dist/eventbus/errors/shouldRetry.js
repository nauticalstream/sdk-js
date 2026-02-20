"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.shouldRetry = shouldRetry;
const errors_1 = require("../../errors");
/**
 * Determine if an error should trigger a retry for NATS/JetStream operations
 */
function shouldRetry(logger, subject, error) {
    if (!(error instanceof errors_1.SystemException)) {
        if (error instanceof Error) {
            logger.warn({ error: error.message, subject, errorType: error.constructor.name }, 'Non-retryable NATS error: giving up without retry');
        }
        return false;
    }
    logger.debug({ error: error.message, subject, errorType: error.constructor.name }, 'Retryable NATS error: will retry');
    return true;
}
//# sourceMappingURL=shouldRetry.js.map