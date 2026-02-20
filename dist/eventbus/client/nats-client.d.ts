import { type NatsConnection, type JetStreamClient, type Codec } from 'nats';
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
export declare class NatsClient {
    private connection;
    private jetstream;
    private readonly codec;
    private isConnected;
    private config;
    constructor(config: NatsClientConfig);
    /**
     * Connect to NATS server
     */
    connect(): Promise<void>;
    /**
     * Setup connection event handlers
     */
    private setupEventHandlers;
    /**
     * Disconnect from NATS server
     */
    disconnect(): Promise<void>;
    /**
     * Get JetStream client
     */
    getJetStream(): JetStreamClient;
    /**
     * Get JetStream Manager for admin operations
     */
    getJetStreamManager(): Promise<import("nats").JetStreamManager>;
    /**
     * Get NATS connection
     */
    getConnection(): NatsConnection;
    /**
     * Get string codec for encoding/decoding messages
     */
    getCodec(): Codec<string>;
    /**
     * Check if connected
     */
    get connected(): boolean;
}
//# sourceMappingURL=nats-client.d.ts.map