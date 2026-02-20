/**
 * Publish operation latency in milliseconds
 */
export declare const publishLatency: import("@opentelemetry/api").Histogram<import("@opentelemetry/api").Attributes>;
/**
 * Successful publish count
 */
export declare const publishSuccess: import("@opentelemetry/api").Counter<import("@opentelemetry/api").Attributes>;
/**
 * Failed publish attempts (before retries)
 */
export declare const publishAttempts: import("@opentelemetry/api").Counter<import("@opentelemetry/api").Attributes>;
/**
 * Retry attempts triggered
 */
export declare const retryAttempts: import("@opentelemetry/api").Counter<import("@opentelemetry/api").Attributes>;
/**
 * Publish errors by type
 */
export declare const publishErrorsByType: import("@opentelemetry/api").Counter<import("@opentelemetry/api").Attributes>;
/**
 * Circuit breaker state transitions
 */
export declare const circuitBreakerState: import("@opentelemetry/api").UpDownCounter<import("@opentelemetry/api").Attributes>;
//# sourceMappingURL=metrics.d.ts.map