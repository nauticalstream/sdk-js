/**
 * Configuration for automatic retry behavior on transient failures
 */
export interface RetryConfig {
    /** Maximum number of retry attempts (total attempts = retries + 1) */
    maxRetries?: number;
    /** Initial delay between attempts in milliseconds */
    initialDelayMs?: number;
    /** Maximum delay between attempts in milliseconds */
    maxDelayMs?: number;
    /** Exponential backoff multiplier */
    backoffFactor?: number;
    /** Maximum time for entire operation including all retries (milliseconds) */
    operationTimeout?: number;
}
/**
 * Default retry configuration: 3 attempts with exponential backoff 100ms → 200ms → 400ms, 5s timeout
 */
export declare const DEFAULT_RETRY_CONFIG: Required<RetryConfig>;
//# sourceMappingURL=config.d.ts.map