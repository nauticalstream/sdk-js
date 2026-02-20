"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_RETRY_CONFIG = void 0;
/**
 * Default retry configuration: 3 attempts with exponential backoff 100ms → 200ms → 400ms, 5s timeout
 */
exports.DEFAULT_RETRY_CONFIG = {
    maxRetries: 2,
    initialDelayMs: 100,
    maxDelayMs: 400,
    backoffFactor: 2,
    operationTimeout: 5000,
};
//# sourceMappingURL=config.js.map