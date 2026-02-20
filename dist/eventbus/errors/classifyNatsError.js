"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.classifyNatsError = classifyNatsError;
const errors_1 = require("../../errors");
/**
 * Classify NATS/JetStream errors to determine if they should be retried
 */
function classifyNatsError(error) {
    if (error instanceof errors_1.SystemException || error instanceof errors_1.DomainException) {
        return error;
    }
    if (!(error instanceof Error)) {
        return new errors_1.ServiceUnavailableError('Unknown NATS error');
    }
    const message = error.message || '';
    // Connection errors → retryable
    if (message.includes('disconnected') ||
        message.includes('lost connection') ||
        message.includes('ECONNREFUSED') ||
        message.includes('connection refused')) {
        return new errors_1.NetworkError(message || 'NATS connection lost');
    }
    // Timeout errors → retryable
    if (message.includes('timeout') || message.includes('ETIMEDOUT')) {
        return new errors_1.TimeoutError(message || 'NATS operation timeout');
    }
    // Invalid subject or format → not retryable (application bug)
    if (message.includes('invalid subject') || message.includes('bad subject')) {
        return new errors_1.ValidationError('Invalid NATS subject - check application logic');
    }
    // Auth errors → not retryable
    if (message.includes('authorization') || message.includes('unauthorized')) {
        return new errors_1.UnauthorizedError('NATS authorization failed - check credentials');
    }
    // Unknown → default to retryable (connection errors more common than logic errors)
    return new errors_1.ServiceUnavailableError(`NATS error: ${message}`);
}
//# sourceMappingURL=classifyNatsError.js.map