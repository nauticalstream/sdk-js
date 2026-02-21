import type { NatsClient } from '../client/nats-client';
import type { Logger } from 'pino';
import type { Message } from '@bufbuild/protobuf';
import type { GenMessage } from '@bufbuild/protobuf/codegenv2';
import { type Event } from '@nauticalstream/proto/platform/v1/event_pb';
import type { ReplyOptions, Unsubscribe } from './types';
export interface ReplyHandlerConfig<TRequest extends Message, TResponse extends Message> {
    source: string;
    reqSchema: GenMessage<TRequest>;
    respSchema: GenMessage<TResponse>;
    handler: (data: TRequest, envelope: Event) => Promise<TResponse>;
    options?: ReplyOptions;
}
/**
 * Subscribe to a request/reply subject (RPC server side)
 * Inbound binary is decoded as platform.v1.Event.
 * Response is re-wrapped in a new Event echoing the inbound correlationId.
 * Core NATS - synchronous RPC pattern (server side)
 *
 * The NATS subject is automatically derived from the request schema's typeName.
 * For example, "user.v1.GetUserRequest" becomes subject "user.v1.get-user-request"
 *
 * @throws Error if NATS is not connected or schema is invalid
 */
export declare function reply<TRequest extends Message, TResponse extends Message>(client: NatsClient, logger: Logger, config: ReplyHandlerConfig<TRequest, TResponse>): Promise<Unsubscribe>;
//# sourceMappingURL=reply.d.ts.map