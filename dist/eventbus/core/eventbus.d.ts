import { JetStreamAPI } from '../jetstream/api';
import type { Logger } from 'pino';
import type { Message, MessageInitShape } from '@bufbuild/protobuf';
import type { GenMessage } from '@bufbuild/protobuf/codegenv2';
import type { Event } from '@nauticalstream/proto/platform/v1/event_pb';
export interface EventBusConfig {
    servers: string[];
    name: string;
    logger?: Logger;
}
/**
 * EventBus - Unified API for NATS messaging patterns
 *
 * Core NATS (ephemeral):
 *   - bus.publish()
 *   - bus.subscribe()
 *   - bus.queueGroup()
 *   - bus.request()
 *   - bus.reply()
 *
 * JetStream (persistent):
 *   - bus.jetstream.publish()
 *   - bus.jetstream.subscribe()
 *   - bus.jetstream.workQueue()
 *   - bus.jetstream.replay()
 *   - bus.jetstream.kv()
 *   - bus.jetstream.objectStore()
 */
export declare class EventBus {
    private client;
    private logger;
    private source;
    jetstream: JetStreamAPI;
    constructor(config: EventBusConfig);
    /**
     * Connect to NATS server
     */
    connect(): Promise<void>;
    /**
     * Disconnect from NATS server
     */
    disconnect(): Promise<void>;
    /**
     * Check connection status
     */
    get connected(): boolean;
    /**
     * Publish message (ephemeral, fire-and-forget)
     * Payload is automatically wrapped in a platform.v1.Event envelope.
     */
    publish<T extends Message>(subject: string, schema: GenMessage<T>, data: T, correlationId?: string): Promise<void>;
    /**
     * Subscribe to subject (ephemeral)
     * Handler receives the deserialized payload and the full Event envelope.
     */
    subscribe<T extends Message>(subject: string, schema: GenMessage<T>, handler: (data: T, envelope: Event) => Promise<void>): Promise<() => void>;
    /**
     * Subscribe with queue group (load balancing)
     * Handler receives the deserialized payload and the full Event envelope.
     */
    queueGroup<T extends Message>(subject: string, queueGroupName: string, schema: GenMessage<T>, handler: (data: T, envelope: Event) => Promise<void>): Promise<() => void>;
    /**
     * Request/reply (synchronous RPC)
     * Both request and response are wrapped in Event envelopes.
     */
    request<TRequest extends Message, TResponse extends Message>(subject: string, reqSchema: GenMessage<TRequest>, respSchema: GenMessage<TResponse>, data: MessageInitShape<GenMessage<TRequest>>, timeoutMs?: number): Promise<TResponse | null>;
    /**
     * Handle requests (reply handler)
     * Handler receives the deserialized request and Event envelope; return value is re-wrapped in an Event echoing the inbound correlationId.
     */
    reply<TRequest extends Message, TResponse extends Message>(subject: string, reqSchema: GenMessage<TRequest>, respSchema: GenMessage<TResponse>, handler: (data: TRequest, envelope: Event) => Promise<TResponse>): Promise<() => Promise<void>>;
}
//# sourceMappingURL=eventbus.d.ts.map