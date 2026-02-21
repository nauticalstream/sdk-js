import { connect, type NatsConnection, type JetStreamClient, StringCodec, type Codec } from 'nats';
import type { Logger } from 'pino';

export interface NatsClientConfig {
  servers: string[];
  name: string;
  logger: Logger;
}

/**
 * NATS JetStream client wrapper
 * Manages connection, reconnection, and provides access to JetStream
 */
export class NatsClient {
  private connection: NatsConnection | null = null;
  private jetstream: JetStreamClient | null = null;
  private readonly codec: Codec<string>;
  private isConnected = false;
  private config: NatsClientConfig;

  constructor(config: NatsClientConfig) {
    this.config = config;
    this.codec = StringCodec();
  }

  /**
   * Connect to NATS server
   */
  async connect(): Promise<void> {
    try {
      this.config.logger.info({ servers: this.config.servers }, 'Connecting to NATS server...');

      this.connection = await connect({
        servers: this.config.servers,
        name: this.config.name,
        maxReconnectAttempts: -1, // Infinite reconnect attempts
        reconnectTimeWait: 2000, // 2 seconds between reconnects
        waitOnFirstConnect: true, // Wait for initial connection instead of failing immediately
      });

      this.jetstream = this.connection.jetstream();
      this.isConnected = true;

      this.config.logger.info('Successfully connected to NATS JetStream');

      // Handle connection events
      this.setupEventHandlers();
    } catch (error) {
      this.config.logger.error({ error }, 'Failed to connect to NATS');
      throw error;
    }
  }

  /**
   * Setup connection event handlers
   */
  private setupEventHandlers(): void {
    if (!this.connection) return;

    (async () => {
      for await (const status of this.connection!.status()) {
        this.config.logger.info({ type: status.type, data: status.data }, 'NATS connection status change');

        if (status.type === 'disconnect' || status.type === 'error') {
          this.isConnected = false;
        } else if (status.type === 'reconnect') {
          this.isConnected = true;
        }
      }
    })();
  }

  /**
   * Disconnect from NATS server
   */
  async disconnect(): Promise<void> {
    if (this.connection) {
      await this.connection.drain();
      await this.connection.close();
      this.isConnected = false;
      this.config.logger.info('Disconnected from NATS');
    }
  }

  /**
   * Get JetStream client
   */
  getJetStream(): JetStreamClient {
    if (!this.jetstream) {
      throw new Error('NATS JetStream not initialized. Call connect() first.');
    }
    return this.jetstream;
  }

  /**
   * Get JetStream Manager for admin operations
   */
  async getJetStreamManager() {
    if (!this.connection) {
      throw new Error('NATS connection not initialized. Call connect() first.');
    }
    return this.connection.jetstreamManager();
  }

  /**
   * Get NATS connection
   */
  getConnection(): NatsConnection {
    if (!this.connection) {
      throw new Error('NATS connection not initialized. Call connect() first.');
    }
    return this.connection;
  }

  /**
   * Get string codec for encoding/decoding messages
   */
  getCodec(): Codec<string> {
    return this.codec;
  }

  /**
   * Check if connected
   */
  get connected(): boolean {
    return this.isConnected;
  }
}
