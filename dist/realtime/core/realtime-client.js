import { MQTTClientManager } from '../client/mqtt-client';
import { serialize, deserialize } from '../utils/serialization';
import { createPublishProperties, withPublishSpan, withMessageSpan } from './telemetry';
import { classifyMQTTError } from '../errors';
import { publishLatency, publishSuccess, publishAttempts, retryAttempts, publishErrorsByType, circuitBreakerState } from './metrics';
import { resilientOperation, getOrCreateCircuitBreaker, shouldRetry, DEFAULT_CIRCUIT_BREAKER_CONFIG } from '../../resilience';
import { DEFAULT_RETRY_CONFIG } from './config';
import { defaultLogger } from '../utils/logger';
/**
 * RealtimeClient - MQTT client with proto serialization and resilience
 */
export class RealtimeClient {
    mqttClient;
    logger;
    name;
    brokerUrl;
    breaker;
    connected = false;
    transportListenersRegistered = false;
    retryConfig;
    constructor(config) {
        this.name = config.name;
        this.brokerUrl = config.brokerUrl;
        this.logger = config.logger || defaultLogger.child({ service: config.name });
        this.retryConfig = { ...DEFAULT_RETRY_CONFIG, ...config.retryConfig };
        this.breaker = getOrCreateCircuitBreaker(this.brokerUrl, { ...DEFAULT_CIRCUIT_BREAKER_CONFIG, stateMetric: circuitBreakerState });
        this.mqttClient = new MQTTClientManager({
            brokerUrl: config.brokerUrl,
            clientId: config.clientId,
            username: config.username,
            password: config.password,
            reconnectPeriod: config.reconnectPeriod,
            connectTimeout: config.connectTimeout,
            clean: config.clean,
            keepalive: config.keepalive,
            logger: this.logger,
        });
    }
    /** Connect to MQTT broker */
    async connect() {
        if (this.connected) {
            return;
        }
        try {
            const mqttClient = await this.mqttClient.connect();
            this.connected = true;
            // Register transport-level listeners exactly once per client instance.
            // These keep this.connected in sync with the underlying socket so that
            // _publishInternal correctly re-enters connect() after a broker disconnect.
            if (!this.transportListenersRegistered) {
                this.transportListenersRegistered = true;
                mqttClient.on('offline', () => { this.connected = false; });
                // mqtt.js fires 'connect' on every successful (re)connect
                mqttClient.on('connect', () => { this.connected = true; });
            }
            this.logger.info({ service: this.name }, 'RealtimeClient connected');
        }
        catch (error) {
            this.logger.error({ error, service: this.name }, 'Failed to connect RealtimeClient');
            throw error;
        }
    }
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
    async publish(topics, message, options = {}) {
        const payload = serialize(message);
        return this._publishInternal(topics, payload, options);
    }
    /** Internal publish implementation with retry + circuit breaker */
    async _publishInternal(topics, payload, options) {
        if (!this.connected) {
            await this.connect();
        }
        const topicArray = Array.isArray(topics) ? topics : [topics];
        const correlationId = options.correlationId ?? crypto.randomUUID();
        const publishOptions = {
            qos: options.qos ?? 1,
            retain: options.retain ?? false,
            properties: {
                userProperties: createPublishProperties(correlationId, this.name)
            }
        };
        const client = this.mqttClient.getClient();
        const payloadSize = Buffer.isBuffer(payload) ? payload.length : Buffer.byteLength(payload);
        const publishToTopic = (topic) => new Promise((resolve, reject) => {
            // Count every attempt including retries so metrics reflect actual traffic
            publishAttempts.add(1, { topic });
            client.publish(topic, payload, publishOptions, (error) => {
                if (error) {
                    const classified = classifyMQTTError(error);
                    publishErrorsByType.add(1, {
                        topic,
                        errorType: classified.constructor.name,
                    });
                    reject(classified);
                }
                else {
                    publishSuccess.add(1, { topic });
                    this.logger.debug({ topic, correlationId, service: this.name }, 'Published message to topic');
                    resolve();
                }
            });
        });
        // Publish to all topics with resilience
        await resilientOperation(() => Promise.all(topicArray.map((topic) => withPublishSpan(topic, payloadSize, () => publishToTopic(topic)))), {
            operation: 'mqtt.publish',
            logger: this.logger,
            classifier: classifyMQTTError,
            shouldRetry,
            retry: this.retryConfig,
            breaker: this.breaker,
            metrics: {
                latency: publishLatency,
                retries: retryAttempts,
            },
            labels: { topics: topicArray.join(',') },
        });
    }
    /** Subscribe to MQTT topic(s) */
    async subscribe(topics, qos = 1) {
        if (!this.connected) {
            await this.connect();
        }
        const topicArray = Array.isArray(topics) ? topics : [topics];
        const client = this.mqttClient.getClient();
        return new Promise((resolve, reject) => {
            client.subscribe(topicArray, { qos }, (error) => {
                if (error) {
                    this.logger.error({ error, topics: topicArray, service: this.name }, 'Failed to subscribe to topics');
                    reject(error);
                }
                else {
                    this.logger.info({ topics: topicArray, service: this.name }, 'Subscribed to topics');
                    resolve();
                }
            });
        });
    }
    /** Unsubscribe from MQTT topic(s) */
    async unsubscribe(topics) {
        const topicArray = Array.isArray(topics) ? topics : [topics];
        const client = this.mqttClient.getClient();
        return new Promise((resolve, reject) => {
            client.unsubscribe(topicArray, (error) => {
                if (error) {
                    this.logger.error({ error, topics: topicArray, service: this.name }, 'Failed to unsubscribe from topics');
                    reject(error);
                }
                else {
                    this.logger.info({ topics: topicArray, service: this.name }, 'Unsubscribed from topics');
                    resolve();
                }
            });
        });
    }
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
    onMessage(handler) {
        const client = this.mqttClient.getClient();
        client.on('message', async (topic, payload, packet) => {
            const userProperties = packet.properties?.userProperties;
            const correlationId = userProperties?.['x-correlation-id'];
            this.logger.debug({ topic, correlationId, service: this.name }, 'Received message');
            await withMessageSpan(topic, userProperties, () => Promise.resolve(handler(topic, deserialize(payload))));
        });
    }
    /**
     * Gracefully disconnect from MQTT broker
     * Waits for pending messages to complete before closing
     */
    async disconnect() {
        if (!this.connected) {
            return;
        }
        try {
            this.logger.info({ service: this.name }, 'Disconnecting RealtimeClient...');
            await this.mqttClient.disconnect();
            this.connected = false;
            // Allow listeners to be re-registered on the next connect() call
            // since mqtt.js creates a new MqttClient instance after disconnect
            this.transportListenersRegistered = false;
            this.logger.info({ service: this.name }, 'RealtimeClient disconnected');
        }
        catch (error) {
            this.logger.error({ error, service: this.name }, 'Error disconnecting RealtimeClient');
            throw error;
        }
    }
    /**
     * Check if client is connected
     */
    isConnected() {
        return this.connected && this.mqttClient.isConnected();
    }
}
//# sourceMappingURL=realtime-client.js.map