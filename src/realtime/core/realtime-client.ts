import { MQTTClientManager } from '../client/mqtt-client.js';
import { serialize, deserialize } from '../utils/serialization.js';
import { createPublishProperties, withPublishSpan, withMessageSpan } from './telemetry.js';
import { classifyMQTTError } from '../errors/index.js';
import { publishLatency, publishSuccess, publishAttempts, retryAttempts, publishErrorsByType, circuitBreakerState } from './metrics.js';
import { resilientOperation, getOrCreateCircuitBreaker, shouldRetry, DEFAULT_CIRCUIT_BREAKER_CONFIG, type ResilientCircuitBreaker } from '../../resilience/index.js';
import { DEFAULT_RETRY_CONFIG, type RetryConfig, type RealtimeClientConfig, type PublishOptions, type QoS } from './config.js';
import { createConsoleLogger, type Logger } from '../../logger/index.js';
import type { IClientPublishOptions, ISubscriptionMap, MqttClient } from 'mqtt';

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
  private retryConfig: RetryConfig & { operationTimeout: number };
  private readonly subscriptions = new Map<string, QoS>();
  private readonly messageHandlers = new Set<(topic: string, payload: unknown) => void | Promise<void>>();
  private messageListenerClient: MqttClient | null = null;

  constructor(config: RealtimeClientConfig) {
    this.name = config.name;
    this.brokerUrl = config.brokerUrl;
    this.logger = config.logger || createConsoleLogger({ service: config.name });
    this.retryConfig = { ...DEFAULT_RETRY_CONFIG, ...config.retryConfig } as RetryConfig & { operationTimeout: number };
    this.breaker = getOrCreateCircuitBreaker(this.brokerUrl, { ...DEFAULT_CIRCUIT_BREAKER_CONFIG, stateMetric: circuitBreakerState });

    // Directly use the password provided in the configuration
    this.mqttClient = new MQTTClientManager({
      brokerUrl: config.brokerUrl,
      clientId: config.clientId,
      username: config.username,
      password: config.password,
      passwordFactory: config.passwordFactory,
      reconnectPeriod: config.reconnectPeriod,
      connectTimeout: config.connectTimeout,
      clean: config.clean,
      keepalive: config.keepalive,
      logger: this.logger,
    });

    this.mqttClient.onLifecycleEvent((event) => {
      if (event.type === 'connect') {
        this.connected = true;
        void this.restoreRuntimeState().catch((error) => {
          this.logger.error({ error, service: this.name }, 'Failed to restore realtime runtime state');
        });
        return;
      }

      if (event.type === 'offline' || event.type === 'close') {
        this.connected = false;
        if (event.type === 'close') {
          this.messageListenerClient = null;
        }
        return;
      }

      if (event.type === 'error') {
        this.connected = false;
      }
    });
  }

  private async restoreRuntimeState(): Promise<void> {
    const client = this.mqttClient.getClient();

    if (this.messageListenerClient !== client) {
      this.messageListenerClient = client;
      client.on('message', async (topic, payload, packet) => {
        const userProperties = packet.properties?.userProperties as Record<string, string | string[]> | undefined;
        const correlationId = userProperties?.['x-correlation-id'] as string | undefined;

        this.logger.debug({ topic, correlationId, service: this.name }, 'Received message');

        for (const handler of this.messageHandlers) {
          await withMessageSpan(topic, userProperties, () =>
            Promise.resolve(handler(topic, deserialize(payload)))
          );
        }
      });
    }

    if (this.subscriptions.size === 0) {
      return;
    }

    const topics = [...this.subscriptions.entries()].reduce<ISubscriptionMap>((accumulator, [topic, qos]) => {
      accumulator[topic] = { qos };
      return accumulator;
    }, {});
    await new Promise<void>((resolve, reject) => {
      client.subscribe(topics, (error) => {
        if (error) {
          reject(error);
          return;
        }

        this.logger.info({ topics: Object.keys(topics), service: this.name }, 'Restored MQTT subscriptions');
        resolve();
      });
    });
  }

  /** Connect to MQTT broker */
  async connect(): Promise<void> {
    if (this.connected && this.mqttClient.isConnected()) {
      return;
    }

    try {
      await this.mqttClient.connect();
      this.connected = true;
      await this.restoreRuntimeState();

      this.logger.info({ service: this.name }, 'RealtimeClient connected');
    } catch (error) {
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
  async publish<T = unknown>(
    topics: string | string[],
    message: T,
    options: PublishOptions = {}
  ): Promise<void> {
    const payload = serialize(message);
    return this._publishInternal(topics, payload, options);
  }

  /** Internal publish implementation with retry + circuit breaker */
  private async _publishInternal(
    topics: string | string[],
    payload: Buffer | string,
    options: PublishOptions,
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
              { topic, correlationId, service: this.name },
              'Published message to topic'
            );
            resolve();
          }
        });
      });

    // Publish to all topics with resilience
    await resilientOperation(
      () => Promise.all(topicArray.map((topic) => withPublishSpan(topic, payloadSize, () => publishToTopic(topic)))),
      {
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
      }
    );
  }

  /** Subscribe to MQTT topic(s) */
  async subscribe(topics: string | string[], qos: QoS = 1): Promise<void> {
    const topicArray = Array.isArray(topics) ? topics : [topics];
    for (const topic of topicArray) {
      this.subscriptions.set(topic, qos);
    }

    if (!this.connected) {
      await this.connect();
    }

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
    for (const topic of topicArray) {
      this.subscriptions.delete(topic);
    }
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
  onMessage<T = unknown>(handler: (topic: string, payload: T) => void | Promise<void>): void {
    this.messageHandlers.add(handler as (topic: string, payload: unknown) => void | Promise<void>);
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
      this.messageListenerClient = null;
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
