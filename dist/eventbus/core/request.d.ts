import type { NatsClient } from '../client/nats-client';
import type { Logger } from 'pino';
import type { Message, MessageInitShape } from '@bufbuild/protobuf';
import type { GenMessage } from '@bufbuild/protobuf/codegenv2';
/**
 * Make a request/reply call to another service (RPC pattern)
 * Request and response are both wrapped in platform.v1.Event envelopes.
 * Core NATS - synchronous RPC pattern
 */
export declare function request<TRequest extends Message, TResponse extends Message>(client: NatsClient, logger: Logger, source: string, subject: string, reqSchema: GenMessage<TRequest>, respSchema: GenMessage<TResponse>, data: MessageInitShape<GenMessage<TRequest>>, timeoutMs?: number): Promise<TResponse | null>;
//# sourceMappingURL=request.d.ts.map