"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NatsClient = void 0;
const nats_1 = require("nats");
/**
 * NATS JetStream client wrapper
 * Manages connection, reconnection, and provides access to JetStream
 */
class NatsClient {
    constructor(config) {
        this.connection = null;
        this.jetstream = null;
        this.isConnected = false;
        this.config = config;
        this.codec = (0, nats_1.StringCodec)();
    }
    /**
     * Connect to NATS server
     */
    async connect() {
        try {
            this.config.logger.info({ servers: this.config.servers }, 'Connecting to NATS server...');
            this.connection = await (0, nats_1.connect)({
                servers: this.config.servers,
                name: this.config.name,
                maxReconnectAttempts: -1, // Infinite reconnect attempts
                reconnectTimeWait: 2000, // 2 seconds between reconnects
            });
            this.jetstream = this.connection.jetstream();
            this.isConnected = true;
            this.config.logger.info('Successfully connected to NATS JetStream');
            // Handle connection events
            this.setupEventHandlers();
        }
        catch (error) {
            this.config.logger.error({ error }, 'Failed to connect to NATS');
            throw error;
        }
    }
    /**
     * Setup connection event handlers
     */
    setupEventHandlers() {
        if (!this.connection)
            return;
        (async () => {
            for await (const status of this.connection.status()) {
                this.config.logger.info({ type: status.type, data: status.data }, 'NATS connection status change');
                if (status.type === 'disconnect' || status.type === 'error') {
                    this.isConnected = false;
                }
                else if (status.type === 'reconnect') {
                    this.isConnected = true;
                }
            }
        })();
    }
    /**
     * Disconnect from NATS server
     */
    async disconnect() {
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
    getJetStream() {
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
    getConnection() {
        if (!this.connection) {
            throw new Error('NATS connection not initialized. Call connect() first.');
        }
        return this.connection;
    }
    /**
     * Get string codec for encoding/decoding messages
     */
    getCodec() {
        return this.codec;
    }
    /**
     * Check if connected
     */
    get connected() {
        return this.isConnected;
    }
}
exports.NatsClient = NatsClient;
//# sourceMappingURL=nats-client.js.map