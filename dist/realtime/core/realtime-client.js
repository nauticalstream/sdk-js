import { MQTTClientManager } from '../client/mqtt-client';
import { serializeProto } from '../utils/serialization';
import { createPublishProperties, withPublishSpan, withMessageSpan } from './telemetry';
import { classifyMQTTError, shouldRetry } from '../errors';
import { publishLatency, publishSuccess, publishAttempts, retryAttempts, publishErrorsByType } from './metrics';
import { getOrCreateBreaker, isBreakerOpen } from './circuit-breaker';
import { DEFAULT_RETRY_CONFIG } from './config';
import { ServiceUnavailableError } from '../../errors';
import { defaultLogger } from '../utils/logger';
import pRetry from 'p-retry';
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
export class RealtimeClient {
    mqttClient;
    logger;
    name;
    brokerUrl;
    breaker;
    connected = false;
    retryConfig;
    constructor(config) {
        this.name = config.name;
        this.brokerUrl = config.brokerUrl;
        this.logger = config.logger || defaultLogger.child({ service: config.name });
        this.retryConfig = { ...DEFAULT_RETRY_CONFIG, ...config.retryConfig };
        this.breaker = getOrCreateBreaker(this.brokerUrl, this.logger);
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
    /**
     * Connect to MQTT broker
     */
    async connect() {
        if (this.connected) {
            return;
        }
        try {
            await this.mqttClient.connect();
            this.connected = true;
            this.logger.info({ service: this.name }, 'RealtimeClient connected');
        }
        catch (error) {
            this.logger.error({ error, service: this.name }, 'Failed to connect RealtimeClient');
            throw error;
        }
    }
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
    async publish(topics, schema, message, options = {}) {
        const payload = serializeProto(schema, message);
        return this._publishInternal(topics, payload, options, 'protobuf');
    }
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
    async publishJSON(topics, message, options = {}) {
        const payload = typeof message === 'string' ? message : JSON.stringify(message);
        return this._publishInternal(topics, payload, options, 'json');
    }
    /**
     * Internal publish implementation shared by publish() and publishJSON()
     * Handles circuit breaker, retries, timeouts, and metrics
     *
     * @private
     */
    async _publishInternal(topics, payload, options, messageType) {
        // Fast-fail if circuit breaker is open (before any work)
        if (isBreakerOpen(this.brokerUrl)) {
            const topicArray = Array.isArray(topics) ? topics : [topics];
            topicArray.forEach((topic) => {
                publishErrorsByType.add(1, { topic, errorType: 'CircuitBreakerOpenError' });
            });
            this.logger.error({ broker: this.brokerUrl, topics: topicArray, messageType }, 'MQTT broker circuit breaker is open - broker unhealthy');
            throw new ServiceUnavailableError('MQTT broker circuit breaker is open');
        }
        // Ensure connected
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
        try {
            const startTime = Date.now();
            // Record publish attempt for each topic
            topicArray.forEach((topic) => {
                publishAttempts.add(1, { topic });
            });
            // Create abort controller for operation timeout
            const abortController = new AbortController();
            const timeoutId = setTimeout(() => abortController.abort(), this.retryConfig.operationTimeout);
            try {
                // Publish with automatic retry on transient failures
                // Wrap pRetry with circuit breaker to fail fast if broker is unhealthy
                await this.breaker.fire(async () => {
                    return pRetry(() => Promise.all(topicArray.map((topic) => withPublishSpan(topic, payloadSize, () => new Promise((resolve, reject) => {
                        client.publish(topic, payload, publishOptions, (error) => {
                            const duration = Date.now() - startTime;
                            publishLatency.record(duration, { topic });
                            if (error) {
                                const classified = classifyMQTTError(error);
                                publishErrorsByType.add(1, {
                                    topic,
                                    errorType: classified.constructor.name,
                                });
                                this.logger.error({ error: error.message, topic, correlationId, service: this.name, messageType }, `Failed to publish ${messageType} to topic`);
                                reject(classified);
                            }
                            else {
                                publishSuccess.add(1, { topic });
                                this.logger.debug({ topic, correlationId, service: this.name, messageType }, `Published ${messageType} to topic`);
                                resolve();
                            }
                        });
                    })))), {
                        retries: this.retryConfig.maxRetries,
                        minTimeout: this.retryConfig.initialDelayMs,
                        maxTimeout: this.retryConfig.maxDelayMs,
                        factor: this.retryConfig.backoffFactor,
                        signal: abortController.signal,
                        shouldRetry: (error) => shouldRetry(this.logger, error),
                        onFailedAttempt: (error) => {
                            topicArray.forEach((topic) => {
                                retryAttempts.add(1, {
                                    topic,
                                    attempt: error.attemptNumber,
                                    errorType: error instanceof Error ? error.constructor.name : 'unknown',
                                });
                            });
                            this.logger.warn({
                                attempt: error.attemptNumber,
                                retriesLeft: error.retriesLeft,
                                error: error.message || String(error),
                                messageType,
                            }, `MQTT publish ${messageType} failed, retrying`);
                        }
                    });
                });
            }
            finally {
                clearTimeout(timeoutId);
            }
        }
        catch (error) {
            this.logger.error({
                error,
                topics: topicArray,
                correlationId,
                service: this.name,
                messageType,
                retries: this.retryConfig.maxRetries
            }, `Failed to publish ${messageType} message after ${this.retryConfig.maxRetries} retries`);
            throw error;
        }
    }
    /**
     * Subscribe to MQTT topic(s)
     *
     * @param topics - Single topic or array of topics
     * @param qos - Quality of Service level
     */
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
    /**
     * Unsubscribe from MQTT topic(s)
     */
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
     * Register message handler for subscribed topics
     * Automatically extracts trace context and correlation ID from MQTT v5 userProperties
     */
    onMessage(handler) {
        const client = this.mqttClient.getClient();
        client.on('message', async (topic, payload, packet) => {
            const userProperties = packet.properties?.userProperties;
            const correlationId = userProperties?.['x-correlation-id'];
            this.logger.debug({ topic, correlationId, service: this.name }, 'Received message');
            await withMessageSpan(topic, userProperties, () => Promise.resolve(handler(topic, payload)));
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