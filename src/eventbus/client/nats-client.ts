import { connect, type NatsConnection, type JetStreamClient } from 'nats';
import type { Logger } from 'pino';

export interface NatsClientConfig {
  servers: string[];
  name: string;
  logger: Logger;
}

/** Managed NATS connection — wraps connect/disconnect and exposes JetStream accessors. */
export class NatsClient {
  private connection: NatsConnection | null = null;
  private jetstream: JetStreamClient | null = null;
  private isConnected = false;
  private config: NatsClientConfig;

  constructor(config: NatsClientConfig) {
    this.config = config;
  }

  /** Connect to NATS and initialise JetStream. Waits for the first connection. */
  async connect(): Promise<void> {
    try {
      this.config.logger.info({ servers: this.config.servers }, 'Connecting to NATS...');

      this.connection = await connect({
        servers: this.config.servers,
        name: this.config.name,
        maxReconnectAttempts: -1,   // infinite
        reconnectTimeWait: 2000,
        waitOnFirstConnect: true,
      });

      this.jetstream = this.connection.jetstream();
      this.isConnected = true;

      this.config.logger.info('Connected to NATS JetStream');
      this.watchStatus();
    } catch (error) {
      this.config.logger.error({ error }, 'Failed to connect to NATS');
      throw error;
    }
  }

  /** Drain in-flight messages then close the connection. */
  async disconnect(): Promise<void> {
    if (this.connection) {
      await this.connection.drain();
      await this.connection.close();
      this.isConnected = false;
      this.config.logger.info('Disconnected from NATS');
    }
  }

  /** Returns the raw NATS connection. Throws if not yet connected. */
  getConnection(): NatsConnection {
    if (!this.connection) throw new Error('NATS not connected — call connect() first');
    return this.connection;
  }

  /** Returns the JetStream client. Throws if not yet connected. */
  getJetStream(): JetStreamClient {
    if (!this.jetstream) throw new Error('JetStream not initialised — call connect() first');
    return this.jetstream;
  }

  /** Returns a JetStream manager for admin operations (consumer/stream CRUD). */
  async getJetStreamManager() {
    if (!this.connection) throw new Error('NATS not connected — call connect() first');
    return this.connection.jetstreamManager();
  }

  get connected(): boolean {
    return this.isConnected;
  }

  /** Log reconnect/disconnect events and keep isConnected in sync. */
  private watchStatus(): void {
    if (!this.connection) return;
    (async () => {
      for await (const status of this.connection!.status()) {
        this.config.logger.info({ type: status.type, data: status.data }, 'NATS status change');
        if (status.type === 'disconnect' || status.type === 'error') this.isConnected = false;
        else if (status.type === 'reconnect') this.isConnected = true;
      }
    })();
  }
}
