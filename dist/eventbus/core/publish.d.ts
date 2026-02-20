import type { NatsClient } from '../client/nats-client';
import type { Logger } from 'pino';
import type { Message } from '@bufbuild/protobuf';
import type { GenMessage } from '@bufbuild/protobuf/codegenv2';
/**
 * Publish message to subject (ephemeral, fire-and-forget)
 * Core NATS - fast, no persistence
 * Payload is automatically wrapped in a platform.v1.Event envelope.
 */
export declare function publish<T extends Message>(client: NatsClient, logger: Logger, source: string, subject: string, schema: GenMessage<T>, data: T, correlationId?: string): Promise<void>;
//# sourceMappingURL=publish.d.ts.map