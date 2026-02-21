/**
 * Default retry configuration: 3 attempts with exponential backoff 100ms → 200ms → 400ms, 5s timeout
 */
export const DEFAULT_RETRY_CONFIG = {
    maxRetries: 2,
    initialDelayMs: 100,
    maxDelayMs: 400,
    backoffFactor: 2,
    operationTimeout: 5000,
};
/**
 * Default timeout for request/reply RPC calls in milliseconds
 */
export const DEFAULT_REQUEST_TIMEOUT_MS = 5000;
//# sourceMappingURL=config.js.map