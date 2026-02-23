import mqtt, { MqttClient, IClientOptions } from 'mqtt';
import type { Logger } from 'pino';

export interface MQTTClientConfig {
  brokerUrl: string;
  clientId?: string;
  username?: string;
  password?: string;
  reconnectPeriod?: number;
  connectTimeout?: number;
  clean?: boolean;
  keepalive?: number;
  logger?: Logger;
}

export class MQTTClientManager {
  private client: MqttClient | null = null;
  private config: MQTTClientConfig;
  private logger?: Logger;
  private isConnecting = false;
  private isDisconnecting = false;

  constructor(config: MQTTClientConfig) {
    this.config = config;
    this.logger = config.logger;
  }

  async connect(): Promise<MqttClient> {
    if (this.client?.connected) {
      return this.client;
    }

    if (this.isConnecting) {
      // Wait for existing connection attempt — reject if it fails
      return new Promise((resolve, reject) => {
        const checkConnection = () => {
          if (this.client?.connected) {
            resolve(this.client);
          } else if (!this.isConnecting) {
            // isConnecting was reset to false without a successful connection — first attempt failed
            reject(new Error('MQTT connection failed during concurrent connect attempt'));
          } else {
            setTimeout(checkConnection, 100);
          }
        };
        checkConnection();
      });
    }

    this.isConnecting = true;

    const options: IClientOptions = {
      clientId: this.config.clientId || `mqtt_${Math.random().toString(16).slice(2, 8)}`,
      username: this.config.username,
      password: this.config.password,
      reconnectPeriod: this.config.reconnectPeriod || 5000,
      connectTimeout: this.config.connectTimeout || 30000,
      clean: this.config.clean !== false,
      keepalive: this.config.keepalive || 60,
      protocolVersion: 5, // Enable MQTT v5 for User Properties support
    };

    return new Promise((resolve, reject) => {
      this.client = mqtt.connect(this.config.brokerUrl, options);

      this.client.on('connect', () => {
        this.logger?.info('MQTT connected');
        this.isConnecting = false;
        resolve(this.client!);
      });

      this.client.on('error', (error) => {
        this.logger?.error({ error }, 'MQTT connection error');
        this.isConnecting = false;
        reject(error);
      });

      this.client.on('reconnect', () => {
        if (!this.isDisconnecting) {
          this.logger?.info('MQTT reconnecting...');
        }
      });

      this.client.on('offline', () => {
        this.logger?.warn('MQTT client offline');
      });

      this.client.on('close', () => {
        this.logger?.info('MQTT connection closed');
      });
    });
  }

  getClient(): MqttClient {
    if (!this.client) {
      throw new Error('MQTT client not initialized. Call connect() first.');
    }
    return this.client;
  }

  /**
   * Returns true only when the underlying MQTT socket is live.
   * Use this to check the actual transport state, not just our local flag.
   */
  isConnected(): boolean {
    return this.client?.connected ?? false;
  }

  /**
   * Gracefully disconnect from MQTT broker
   * Allows pending messages to complete before closing
   */
  async disconnect(): Promise<void> {
    if (!this.client) {
      return;
    }

    this.isDisconnecting = true;

    try {
      // End connection gracefully (force=false allows pending messages to complete)
      await this.client.endAsync(false);
      this.logger?.info('Disconnected from MQTT broker');
    } catch (error) {
      this.logger?.error({ error }, 'Error during MQTT disconnect');
      throw error;
    } finally {
      this.client = null;
      this.isDisconnecting = false;
    }
  }
}
