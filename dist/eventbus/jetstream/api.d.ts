import { type Message, type MessageInitShape } from '@bufbuild/protobuf';
import type { GenMessage } from '@bufbuild/protobuf/codegenv2';
import type { KV, ObjectStore } from 'nats';
import type { Logger } from 'pino';
import type { NatsClient } from '../client/nats-client';
import type { Event } from '@nauticalstream/proto/platform/v1/event_pb';
import { type JetStreamPublishOptions } from './publish';
import { type ErrorClassifier } from './subscribe';
/**
 * High-level JetStream API — persistent, durable, at-least-once delivery.
 * All methods delegate to focused single-responsibility modules.
 */
export declare class JetStreamAPI {
    private client;
    private logger;
    private source;
    constructor(client: NatsClient, logger: Logger, source: string);
    /**
     * Publish to JetStream with retry and circuit breaker.
     * Subject is auto-derived from schema.typeName unless overridden.
     */
    publish<T extends Message>(schema: GenMessage<T>, data: MessageInitShape<GenMessage<T>>, options?: JetStreamPublishOptions): Promise<{
        ok: boolean;
        error?: boolean;
    }>;
    /**
     * Subscribe to a JetStream stream with a durable consumer.
     * Handler receives the typed domain message and the full platform.v1.Event envelope.
     * Use errorClassifier to control retry / discard / deadletter behaviour per error type.
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
     * Work queue — at-least-once delivery with concurrency 1.
     * Uses a stable durable consumer name so messages queued during downtime
     * are delivered to the same consumer on restart.
     */
    workQueue<T extends Message>(config: {
        stream: string;
        subject: string;
        schema: GenMessage<T>;
        handler: (data: T, envelope: Event) => Promise<void>;
        maxDeliveries?: number;
    }): Promise<() => Promise<void>>;
    /**
     * Replay stream events starting from a timestamp or sequence number.
     * Uses an ephemeral consumer that is deleted on cleanup.
     */
    replay<T extends Message>(config: {
        stream: string;
        startTime?: number;
        startSequence?: number;
        subject?: string;
        schema: GenMessage<T>;
        handler: (data: T, envelope: Event) => Promise<void>;
    }): Promise<() => Promise<void>>;
    /** Get or create a JetStream Key-Value bucket. */
    kv(bucketName: string): Promise<KV>;
    /** Get or create a JetStream Object Store bucket. */
    objectStore(bucketName: string): Promise<ObjectStore>;
}
//# sourceMappingURL=api.d.ts.map