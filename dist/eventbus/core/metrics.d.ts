/**
 * JetStream publish latency in milliseconds
 */
export declare const jetstreamPublishLatency: import("@opentelemetry/api").Histogram<import("@opentelemetry/api").Attributes>;
/**
 * Successful JetStream publishes
 */
export declare const jetstreamPublishSuccess: import("@opentelemetry/api").Counter<import("@opentelemetry/api").Attributes>;
/**
 * JetStream publish attempts
 */
export declare const jetstreamPublishAttempts: import("@opentelemetry/api").Counter<import("@opentelemetry/api").Attributes>;
/**
 * JetStream retry attempts
 */
export declare const jetstreamRetryAttempts: import("@opentelemetry/api").Counter<import("@opentelemetry/api").Attributes>;
/**
 * JetStream publish errors by type
 */
export declare const jetstreamPublishErrors: import("@opentelemetry/api").Counter<import("@opentelemetry/api").Attributes>;
/**
 * Circuit breaker state for JetStream
 */
export declare const jetstreamCircuitBreakerState: import("@opentelemetry/api").UpDownCounter<import("@opentelemetry/api").Attributes>;
//# sourceMappingURL=metrics.d.ts.map