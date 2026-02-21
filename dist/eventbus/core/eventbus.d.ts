import { JetStreamAPI } from '../jetstream/api';
import type { Logger } from 'pino';
import type { Message, MessageInitShape } from '@bufbuild/protobuf';
import type { GenMessage } from '@bufbuild/protobuf/codegenv2';
import type { Event } from '@nauticalstream/proto/platform/v1/event_pb';
import type { PublishOptions, QueueGroupOptions, RequestOptions, ReplyOptions, Unsubscribe } from './types';
export interface EventBusConfig {
    servers: string[];
    name: string;
    logger?: Logger;
}
/** EventBus - NATS messaging with ephemeral and persistent patterns */
export declare class EventBus {
    private client;
    private logger;
    private source;
    jetstream: JetStreamAPI;
    constructor(config: EventBusConfig);
    /** Connect to NATS server */
    connect(): Promise<void>;
    /** Disconnect from NATS server */
    disconnect(): Promise<void>;
    /** Check connection status */
    get connected(): boolean;
    /** Publish message (ephemeral, fire-and-forget) */
    publish<T extends Message>(schema: GenMessage<T>, data: MessageInitShape<GenMessage<T>>, options?: PublishOptions): Promise<void>;
    /** Subscribe to subject (ephemeral) */
    subscribe<T extends Message>(schema: GenMessage<T>, handler: (data: T, envelope: Event) => Promise<void>): Promise<Unsubscribe>;
    /** Subscribe with queue group (load balancing) */
    queueGroup<T extends Message>(schema: GenMessage<T>, handler: (data: T, envelope: Event) => Promise<void>, options: QueueGroupOptions): Promise<Unsubscribe>;
    /** Request/reply (synchronous RPC) */
    request<TRequest extends Message, TResponse extends Message>(reqSchema: GenMessage<TRequest>, respSchema: GenMessage<TResponse>, data: MessageInitShape<GenMessage<TRequest>>, options?: RequestOptions): Promise<TResponse>;
    /** Handle requests (reply handler) */
    reply<TRequest extends Message, TResponse extends Message>(reqSchema: GenMessage<TRequest>, respSchema: GenMessage<TResponse>, handler: (data: TRequest, envelope: Event) => Promise<MessageInitShape<GenMessage<TResponse>>>, options?: ReplyOptions): Promise<Unsubscribe>;
}
//# sourceMappingURL=eventbus.d.ts.map