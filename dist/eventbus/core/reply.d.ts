import type { NatsClient } from '../client/nats-client';
import type { Logger } from 'pino';
import type { Message } from '@bufbuild/protobuf';
import type { GenMessage } from '@bufbuild/protobuf/codegenv2';
import { type Event } from '@nauticalstream/proto/platform/v1/event_pb';
export interface ReplyHandlerConfig<TRequest extends Message = any, TResponse extends Message = any> {
    subject: string;
    source: string;
    reqSchema: GenMessage<TRequest>;
    respSchema: GenMessage<TResponse>;
    handler: (data: TRequest, envelope: Event) => Promise<TResponse>;
}
/**
 * Subscribe to a request/reply subject (RPC server side)
 * Inbound binary is decoded as platform.v1.Event.
 * Response is re-wrapped in a new Event echoing the inbound correlationId.
 * Core NATS - synchronous RPC pattern (server side)
 */
export declare function reply<TRequest extends Message = any, TResponse extends Message = any>(client: NatsClient, logger: Logger, config: ReplyHandlerConfig<TRequest, TResponse>): Promise<() => Promise<void>>;
//# sourceMappingURL=reply.d.ts.map