import type { NatsClient } from '../client/nats-client';
import type { Logger } from 'pino';
import type { KV, ObjectStore } from 'nats';
import { type Message } from '@bufbuild/protobuf';
import type { GenMessage } from '@bufbuild/protobuf/codegenv2';
import { type Event } from '@nauticalstream/proto/platform/v1/event_pb';
import type { ErrorClassifier } from './subscribe';
/**
 * JetStream API - persistent, reliable, durable operations
 */
export declare class JetStreamAPI {
    private client;
    private logger;
    private source;
    constructor(client: NatsClient, logger: Logger, source: string);
    /**
     * Publish to JetStream (persistent)
     * Payload is automatically wrapped in a platform.v1.Event envelope.
     */
    publish<T extends Message>(subject: string, schema: GenMessage<T>, data: T, correlationId?: string): Promise<{
        ok: boolean;
        error?: boolean;
    }>;
    /**
     * Subscribe to JetStream with durable consumer.
     * Deserializes incoming binary data using the provided protobuf schema.
     */
    subscribe<T extends Message>(config: {
        stream: string;
        consumer: string;
        subject: string;
        schema: GenMessage<T>;
        handler: (data: T, envelope: Event) => Promise<void>;
        concurrency?: number;
        retryDelayMs?: number;
        maxDeliveries?: number;
        errorClassifier?: ErrorClassifier;
    }): Promise<() => Promise<void>>;
    /**
     * Work queue pattern - at-least-once delivery
     */
    workQueue<T extends Message>(config: {
        stream: string;
        subject: string;
        schema: GenMessage<T>;
        handler: (data: T, envelope: Event) => Promise<void>;
        maxRetries?: number;
        ackWait?: number;
    }): Promise<() => Promise<void>>;
    /**
     * Replay stream from timestamp
     */
    replay<T extends Message>(config: {
        stream: string;
        startTime?: number;
        startSequence?: number;
        subject?: string;
        schema: GenMessage<T>;
        handler: (data: T, envelope: Event) => Promise<void>;
    }): Promise<() => Promise<void>>;
    /**
     * Get Key-Value store bucket
     */
    kv(bucketName: string): Promise<KV>;
    /**
     * Get Object Store bucket
     */
    objectStore(bucketName: string): Promise<ObjectStore>;
}
//# sourceMappingURL=api.d.ts.map