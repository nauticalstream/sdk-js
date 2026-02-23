import { connect } from 'nats';
/** Managed NATS connection — wraps connect/disconnect and exposes JetStream accessors. */
export class NatsClient {
    connection = null;
    jetstream = null;
    isConnected = false;
    config;
    constructor(config) {
        this.config = config;
    }
    /** Connect to NATS and initialise JetStream. Waits for the first connection. */
    async connect() {
        try {
            this.config.logger.info({ servers: this.config.servers }, 'Connecting to NATS...');
            this.connection = await connect({
                servers: this.config.servers,
                name: this.config.name,
                maxReconnectAttempts: -1, // infinite
                reconnectTimeWait: 2000,
                waitOnFirstConnect: true,
            });
            this.jetstream = this.connection.jetstream();
            this.isConnected = true;
            this.config.logger.info('Connected to NATS JetStream');
            this.watchStatus();
        }
        catch (error) {
            this.config.logger.error({ error }, 'Failed to connect to NATS');
            throw error;
        }
    }
    /** Drain in-flight messages then close the connection. */
    async disconnect() {
        if (this.connection) {
            await this.connection.drain();
            await this.connection.close();
            this.isConnected = false;
            this.config.logger.info('Disconnected from NATS');
        }
    }
    /** Returns the raw NATS connection. Throws if not yet connected. */
    getConnection() {
        if (!this.connection)
            throw new Error('NATS not connected — call connect() first');
        return this.connection;
    }
    /** Returns the JetStream client. Throws if not yet connected. */
    getJetStream() {
        if (!this.jetstream)
            throw new Error('JetStream not initialised — call connect() first');
        return this.jetstream;
    }
    /** Returns a JetStream manager for admin operations (consumer/stream CRUD). */
    async getJetStreamManager() {
        if (!this.connection)
            throw new Error('NATS not connected — call connect() first');
        return this.connection.jetstreamManager();
    }
    get connected() {
        return this.isConnected;
    }
    /** Log reconnect/disconnect events and keep isConnected in sync. */
    watchStatus() {
        if (!this.connection)
            return;
        (async () => {
            for await (const status of this.connection.status()) {
                this.config.logger.info({ type: status.type, data: status.data }, 'NATS status change');
                if (status.type === 'disconnect' || status.type === 'error')
                    this.isConnected = false;
                else if (status.type === 'reconnect')
                    this.isConnected = true;
            }
        })();
    }
}
//# sourceMappingURL=nats-client.js.map