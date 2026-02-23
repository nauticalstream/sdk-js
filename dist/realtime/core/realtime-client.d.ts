import { type RealtimeClientConfig, type PublishOptions, type QoS } from './config';
import type { Message } from '@bufbuild/protobuf';
import type { GenMessage } from '@bufbuild/protobuf/codegenv2';
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
    /** Publish a protobuf message to one or more MQTT topics */
    publish<T extends Message>(topics: string | string[], schema: GenMessage<T>, message: T, options?: PublishOptions): Promise<void>;
    /** Publish a JSON-serializable object to one or more MQTT topics */
    publishJSON(topics: string | string[], message: any, options?: PublishOptions): Promise<void>;
    /** Internal publish implementation with retry + circuit breaker */
    private _publishInternal;
    /** Subscribe to MQTT topic(s) */
    subscribe(topics: string | string[], qos?: QoS): Promise<void>;
    /** Unsubscribe from MQTT topic(s) */
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