import mqtt, { MqttClient } from 'mqtt';
import type { IClientOptions } from 'mqtt';
import type { Logger } from '../../logger/index.js';
import type { RealtimePasswordFactory } from '../core/config.js';

export interface MQTTLifecycleEvent {
  type: 'connect' | 'reconnect' | 'offline' | 'close' | 'error';
  error?: Error;
}

type MQTTLifecycleListener = (event: MQTTLifecycleEvent) => void;

export interface MQTTClientConfig {
  brokerUrl: string;
  clientId?: string;
  username?: string;
  password?: string;
  passwordFactory?: RealtimePasswordFactory;
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
  private reconnectTimer: NodeJS.Timeout | null = null;
  private lifecycleListeners = new Set<MQTTLifecycleListener>();

  constructor(config: MQTTClientConfig) {
    this.config = config;
    this.logger = config.logger;
  }

  onLifecycleEvent(listener: MQTTLifecycleListener): () => void {
    this.lifecycleListeners.add(listener);

    return () => {
      this.lifecycleListeners.delete(listener);
    };
  }

  private emitLifecycleEvent(event: MQTTLifecycleEvent): void {
    for (const listener of this.lifecycleListeners) {
      listener(event);
    }
  }

  private clearReconnectTimer(): void {
    if (!this.reconnectTimer) {
      return;
    }

    clearTimeout(this.reconnectTimer);
    this.reconnectTimer = null;
  }

  private scheduleReconnect(): void {
    const reconnectDelay = this.config.reconnectPeriod ?? 5000;
    if (this.isDisconnecting || reconnectDelay <= 0 || this.reconnectTimer || this.isConnecting) {
      return;
    }

    this.emitLifecycleEvent({ type: 'reconnect' });
    this.logger?.info('MQTT reconnecting...');
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      void this.connect().catch((error) => {
        this.logger?.error({ error }, 'MQTT reconnect attempt failed');
      });
    }, reconnectDelay);
  }

  private async resolvePassword(): Promise<string | undefined> {
    if (this.config.passwordFactory) {
      return this.config.passwordFactory();
    }

    return this.config.password;
  }

  private async buildOptions(): Promise<IClientOptions> {
    const password = await this.resolvePassword();

    return {
      clientId: this.config.clientId || `mqtt_${Math.random().toString(16).slice(2, 8)}`,
      username: this.config.username,
      password,
      reconnectPeriod: 0,
      connectTimeout: this.config.connectTimeout ?? 30000,
      clean: this.config.clean !== false,
      keepalive: this.config.keepalive ?? 60,
      protocolVersion: 5,
    };
  }

  private attachLifecycleHandlers(client: MqttClient): void {
    client.on('connect', () => {
      this.logger?.info('MQTT connected');
      this.emitLifecycleEvent({ type: 'connect' });
    });

    client.on('error', (error) => {
      this.logger?.error({ error }, 'MQTT connection error');
      this.emitLifecycleEvent({ type: 'error', error: error as Error });
    });

    client.on('offline', () => {
      this.logger?.warn('MQTT client offline');
      this.emitLifecycleEvent({ type: 'offline' });
      this.scheduleReconnect();
    });

    client.on('close', () => {
      this.client = null;
      this.logger?.info('MQTT connection closed');
      this.emitLifecycleEvent({ type: 'close' });
      this.scheduleReconnect();
    });
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
    this.clearReconnectTimer();

    try {
      const options = await this.buildOptions();

      return await new Promise((resolve, reject) => {
        const client = mqtt.connect(this.config.brokerUrl, options);
        this.client = client;
        this.attachLifecycleHandlers(client);

        const handleConnect = () => {
          client.removeListener('error', handleError);
          this.isConnecting = false;
          resolve(client);
        };

        const handleError = (error: Error) => {
          client.removeListener('connect', handleConnect);
          this.isConnecting = false;
          this.client = null;
          this.scheduleReconnect();
          reject(error);
        };

        client.once('connect', handleConnect);
        client.once('error', handleError);
      });
    } catch (error) {
      this.isConnecting = false;
      this.client = null;
      this.scheduleReconnect();
      throw error;
    }
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
    this.clearReconnectTimer();

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
