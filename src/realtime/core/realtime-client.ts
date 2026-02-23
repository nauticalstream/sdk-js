import { MQTTClientManager } from '../client/mqtt-client';
import { serializeProto } from '../utils/serialization';
import { createPublishProperties, withPublishSpan, withMessageSpan } from './telemetry';
import { classifyMQTTError } from '../errors';
import { publishLatency, publishSuccess, publishAttempts, retryAttempts, publishErrorsByType, circuitBreakerState } from './metrics';
import { resilientOperation, getOrCreateCircuitBreaker, shouldRetry, DEFAULT_CIRCUIT_BREAKER_CONFIG, type ResilientCircuitBreaker } from '../../resilience';
import { DEFAULT_RETRY_CONFIG, type RetryConfig, type RealtimeClientConfig, type PublishOptions, type QoS } from './config';
import { defaultLogger } from '../utils/logger';
import type { Message } from '@bufbuild/protobuf';
import type { GenMessage } from '@bufbuild/protobuf/codegenv2';
import type { Logger } from 'pino';
import type { IClientPublishOptions } from 'mqtt';

/**
 * RealtimeClient - MQTT client with proto serialization and resilience
 */
export class RealtimeClient {
  private mqttClient: MQTTClientManager;
  private logger: Logger;
  private name: string;
  private brokerUrl: string;
  private breaker: ResilientCircuitBreaker;
  private connected = false;
  private transportListenersRegistered = false;
  private retryConfig: RetryConfig & { operationTimeout: number };

  constructor(config: RealtimeClientConfig) {
    this.name = config.name;
    this.brokerUrl = config.brokerUrl;
    this.logger = config.logger || defaultLogger.child({ service: config.name });
    this.retryConfig = { ...DEFAULT_RETRY_CONFIG, ...config.retryConfig } as RetryConfig & { operationTimeout: number };
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
  async connect(): Promise<void> {
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
    } catch (error) {
      this.logger.error({ error, service: this.name }, 'Failed to connect RealtimeClient');
      throw error;
    }
  }

  /** Publish a protobuf message to one or more MQTT topics */
  async publish<T extends Message>(
    topics: string | string[],
    schema: GenMessage<T>,
    message: T,
    options: PublishOptions = {}
  ): Promise<void> {
    const payload = serializeProto(schema, message);
    return this._publishInternal(topics, payload, options, 'protobuf');
  }

  /** Publish a JSON-serializable object to one or more MQTT topics */
  async publishJSON(
    topics: string | string[],
    message: any,
    options: PublishOptions = {}
  ): Promise<void> {
    const payload = typeof message === 'string' ? message : JSON.stringify(message);
    return this._publishInternal(topics, payload, options, 'json');
  }

  /** Internal publish implementation with retry + circuit breaker */
  private async _publishInternal(
    topics: string | string[],
    payload: Buffer | string,
    options: PublishOptions,
    messageType: 'protobuf' | 'json'
  ): Promise<void> {
    if (!this.connected) {
      await this.connect();
    }

    const topicArray = Array.isArray(topics) ? topics : [topics];
    const correlationId = options.correlationId ?? crypto.randomUUID();
    
    const publishOptions: IClientPublishOptions = {
      qos: options.qos ?? 1,
      retain: options.retain ?? false,
      properties: {
        userProperties: createPublishProperties(correlationId, this.name)
      }
    };

    const client = this.mqttClient.getClient();
    const payloadSize = Buffer.isBuffer(payload) ? payload.length : Buffer.byteLength(payload);

    const publishToTopic = (topic: string): Promise<void> =>
      new Promise<void>((resolve, reject) => {
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
          } else {
            publishSuccess.add(1, { topic });
            this.logger.debug(
              { topic, correlationId, service: this.name, messageType },
              `Published ${messageType} to topic`
            );
            resolve();
          }
        });
      });

    // Publish to all topics with resilience
    await resilientOperation(
      () => Promise.all(topicArray.map((topic) => withPublishSpan(topic, payloadSize, () => publishToTopic(topic)))),
      {
        operation: `mqtt.publish.${messageType}`,
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
      }
    );
  }

  /** Subscribe to MQTT topic(s) */
  async subscribe(topics: string | string[], qos: QoS = 1): Promise<void> {
    if (!this.connected) {
      await this.connect();
    }

    const topicArray = Array.isArray(topics) ? topics : [topics];
    const client = this.mqttClient.getClient();

    return new Promise((resolve, reject) => {
      client.subscribe(topicArray, { qos }, (error) => {
        if (error) {
          this.logger.error(
            { error, topics: topicArray, service: this.name },
            'Failed to subscribe to topics'
          );
          reject(error);
        } else {
          this.logger.info(
            { topics: topicArray, service: this.name },
            'Subscribed to topics'
          );
          resolve();
        }
      });
    });
  }

  /** Unsubscribe from MQTT topic(s) */
  async unsubscribe(topics: string | string[]): Promise<void> {
    const topicArray = Array.isArray(topics) ? topics : [topics];
    const client = this.mqttClient.getClient();

    return new Promise((resolve, reject) => {
      client.unsubscribe(topicArray, (error) => {
        if (error) {
          this.logger.error(
            { error, topics: topicArray, service: this.name },
            'Failed to unsubscribe from topics'
          );
          reject(error);
        } else {
          this.logger.info(
            { topics: topicArray, service: this.name },
            'Unsubscribed from topics'
          );
          resolve();
        }
      });
    });
  }

  /**
   * Register message handler for subscribed topics
   * Automatically extracts trace context and correlation ID from MQTT v5 userProperties
   */
  onMessage(handler: (topic: string, payload: Buffer) => void | Promise<void>): void {
    const client = this.mqttClient.getClient();
    client.on('message', async (topic, payload, packet) => {
      const userProperties = packet.properties?.userProperties as Record<string, string | string[]> | undefined;
      const correlationId = userProperties?.['x-correlation-id'] as string | undefined;
      
      this.logger.debug({ topic, correlationId, service: this.name }, 'Received message');
      
      await withMessageSpan(topic, userProperties, () => 
        Promise.resolve(handler(topic, payload))
      );
    });
  }

  /**
   * Gracefully disconnect from MQTT broker
   * Waits for pending messages to complete before closing
   */
  async disconnect(): Promise<void> {
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
    } catch (error) {
      this.logger.error({ error, service: this.name }, 'Error disconnecting RealtimeClient');
      throw error;
    }
  }

  /**
   * Check if client is connected
   */
  isConnected(): boolean {
    return this.connected && this.mqttClient.isConnected();
  }
}
