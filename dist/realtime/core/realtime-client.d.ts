import { type RealtimeClientConfig, type PublishOptions, type QoS } from './config';
/**
 * RealtimeClient - MQTT client with proto serialization and resilience
 */
export declare class RealtimeClient {
    private mqttClient;
    private logger;
    private name;
    private brokerUrl;
    private breaker;
    private connected;
    private transportListenersRegistered;
    private retryConfig;
    constructor(config: RealtimeClientConfig);
    /** Connect to MQTT broker */
    connect(): Promise<void>;
    /**
     * Publish a message to one or more MQTT topics.
     * The message is serialized as JSON. Use proto-generated types for full type safety.
     *
     * @example
     * ```typescript
     * import type { ChatMessage } from '@nauticalstream/proto/chat/v1/chat_pb';
     * await client.publish<ChatMessage>(TOPICS.chat.message(roomId), { content: 'Hello', authorId: userId });
     * ```
     */
    publish<T = unknown>(topics: string | string[], message: T, options?: PublishOptions): Promise<void>;
    /** Internal publish implementation with retry + circuit breaker */
    private _publishInternal;
    /** Subscribe to MQTT topic(s) */
    subscribe(topics: string | string[], qos?: QoS): Promise<void>;
    /** Unsubscribe from MQTT topic(s) */
    unsubscribe(topics: string | string[]): Promise<void>;
    /**
     * Register a typed message handler for subscribed topics.
     * The JSON payload is automatically parsed — use a proto-generated type for T.
     * Trace context and correlation ID are automatically extracted from MQTT v5 user properties.
     *
     * @example
     * ```typescript
     * import type { ChatMessage } from '@nauticalstream/proto/chat/v1/chat_pb';
     * client.onMessage<ChatMessage>(TOPICS.chat.message(roomId), (topic, message) => {
     *   console.log(message.content); // fully typed
     * });
     * ```
     */
    onMessage<T = unknown>(handler: (topic: string, payload: T) => void | Promise<void>): void;
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