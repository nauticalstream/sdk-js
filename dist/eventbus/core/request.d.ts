import type { NatsClient } from '../client/nats-client';
import type { Logger } from 'pino';
import type { Message, MessageInitShape } from '@bufbuild/protobuf';
import type { GenMessage } from '@bufbuild/protobuf/codegenv2';
import type { RequestOptions } from './types';
/**
 * Make a request/reply call to another service (RPC pattern)
 * Request and response are both wrapped in platform.v1.Event envelopes.
 * Core NATS - synchronous RPC pattern
 *
 * The NATS subject is automatically derived from the request schema's typeName.
 * For example, "user.v1.GetUserRequest" becomes subject "user.v1.get-user-request"
 *
 * @throws Error if NATS is not connected, request times out, or receives error response
 */
export declare function request<TRequest extends Message, TResponse extends Message>(client: NatsClient, logger: Logger, source: string, reqSchema: GenMessage<TRequest>, respSchema: GenMessage<TResponse>, data: MessageInitShape<GenMessage<TRequest>>, options?: RequestOptions): Promise<TResponse>;
//# sourceMappingURL=request.d.ts.map