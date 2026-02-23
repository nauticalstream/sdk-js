import { type NatsConnection, type JetStreamClient } from 'nats';
import type { Logger } from 'pino';
export interface NatsClientConfig {
    servers: string[];
    name: string;
    logger: Logger;
}
/** Managed NATS connection — wraps connect/disconnect and exposes JetStream accessors. */
export declare class NatsClient {
    private connection;
    private jetstream;
    private isConnected;
    private config;
    constructor(config: NatsClientConfig);
    /** Connect to NATS and initialise JetStream. Waits for the first connection. */
    connect(): Promise<void>;
    /** Drain in-flight messages then close the connection. */
    disconnect(): Promise<void>;
    /** Returns the raw NATS connection. Throws if not yet connected. */
    getConnection(): NatsConnection;
    /** Returns the JetStream client. Throws if not yet connected. */
    getJetStream(): JetStreamClient;
    /** Returns a JetStream manager for admin operations (consumer/stream CRUD). */
    getJetStreamManager(): Promise<import("nats").JetStreamManager>;
    get connected(): boolean;
    /** Log reconnect/disconnect events and keep isConnected in sync. */
    private watchStatus;
}
//# sourceMappingURL=nats-client.d.ts.map