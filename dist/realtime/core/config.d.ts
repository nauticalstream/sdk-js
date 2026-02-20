import type { Logger } from 'pino';
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
/**
 * MQTT Quality of Service levels
 */
export type QoS = 0 | 1 | 2;
/**
 * Options for MQTT publish operations
 */
export interface PublishOptions {
    qos?: QoS;
    retain?: boolean;
    correlationId?: string;
}
/**
 * Configuration for RealtimeClient instance
 */
export interface RealtimeClientConfig {
    brokerUrl: string;
    name: string;
    logger?: Logger;
    clientId?: string;
    username?: string;
    password?: string;
    reconnectPeriod?: number;
    connectTimeout?: number;
    clean?: boolean;
    keepalive?: number;
    /** Retry configuration for publish operations. Uses defaults if not provided. */
    retryConfig?: RetryConfig;
}
//# sourceMappingURL=config.d.ts.map