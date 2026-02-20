import { type RealtimeClientConfig, type PublishOptions, type QoS } from './config';
import type { Message } from '@bufbuild/protobuf';
import type { GenMessage } from '@bufbuild/protobuf/codegenv2';
/**
 * RealtimeClient provides a clean, singleton-style MQTT client for NauticalStream services.
 *
 * Features:
 * - Proto-based message serialization
 * - Automatic connection management
 * - Type-safe topic publishing
 * - Singleton pattern per service
 *
 * Usage:
 * ```typescript
 * import { realtime } from '@src/shared/realtime';
 * import { TOPICS } from '@nauticalstream/realtime';
 *
 * await realtime.publish(
 *   [TOPICS.CHAT.user('123'), TOPICS.CHAT.conversation('456')],
 *   ChatMessageSchema,
 *   message
 * );
 * ```
 */
export declare class RealtimeClient {
    private mqttClient;
    private logger;
    private name;
    private brokerUrl;
    private breaker;
    private connected;
    private retryConfig;
    constructor(config: RealtimeClientConfig);
    /**
     * Connect to MQTT broker
     */
    connect(): Promise<void>;
    /**
     * Publish a protobuf message to one or more MQTT topics
     *
     * Features:
     * - Circuit breaker protection (fast-fail when broker unhealthy)
     * - Automatic retry with exponential backoff
     * - Timeout enforcement (configurable via retryConfig.operationTimeout)
     * - Full OpenTelemetry metrics and tracing
     *
     * @param topics - Single topic or array of topics
     * @param schema - Protobuf message schema
     * @param message - Message instance to publish
     * @param options - Publish options (QoS, retain, correlationId)
     * @throws {ServiceUnavailableError} Circuit breaker open
     * @throws {ResourceExhaustedError} All retries exhausted
     * @throws {OperationTimeoutError} Operation timeout exceeded
     */
    publish<T extends Message>(topics: string | string[], schema: GenMessage<T>, message: T, options?: PublishOptions): Promise<void>;
    /**
     * Publish a JSON-serializable object to one or more MQTT topics
     *
     * Features:
     * - Circuit breaker protection (fast-fail when broker unhealthy)
     * - Automatic retry with exponential backoff
     * - Timeout enforcement (configurable via retryConfig.operationTimeout)
     * - Full OpenTelemetry metrics and tracing
     *
     * @param topics - Single topic or array of topics
     * @param message - JavaScript object to serialize and publish
     * @param options - Publish options (QoS, retain, correlationId)
     * @throws {ServiceUnavailableError} Circuit breaker open
     * @throws {ResourceExhaustedError} All retries exhausted
     * @throws {OperationTimeoutError} Operation timeout exceeded
     */
    publishJSON(topics: string | string[], message: any, options?: PublishOptions): Promise<void>;
    /**
     * Internal publish implementation shared by publish() and publishJSON()
     * Handles circuit breaker, retries, timeouts, and metrics
     *
     * @private
     */
    private _publishInternal;
    /**
     * Subscribe to MQTT topic(s)
     *
     * @param topics - Single topic or array of topics
     * @param qos - Quality of Service level
     */
    subscribe(topics: string | string[], qos?: QoS): Promise<void>;
    /**
     * Unsubscribe from MQTT topic(s)
     */
    unsubscribe(topics: string | string[]): Promise<void>;
    /**
     * Register message handler for subscribed topics
     * Automatically extracts trace context and correlation ID from MQTT v5 userProperties
     */
    onMessage(handler: (topic: string, payload: Buffer) => void | Promise<void>): void;
    /**
     * Gracefully disconnect from MQTT broker
     * Waits for pending messages to complete before closing
     */
    disconnect(): Promise<void>;
    /**
     * Check if client is connected
     */
    isConnected(): boolean;
}
//# sourceMappingURL=realtime-client.d.ts.map