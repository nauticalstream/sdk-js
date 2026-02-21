import type { NatsClient } from '../client/nats-client';
import type { Logger } from 'pino';
import type { Message } from '@bufbuild/protobuf';
import type { GenMessage } from '@bufbuild/protobuf/codegenv2';
import type { PublishOptions } from './types';
/**
 * Publish message to subject (ephemeral, fire-and-forget)
 * Core NATS - fast, no persistence
 * Payload is automatically wrapped in a platform.v1.Event envelope.
 *
 * The NATS subject is automatically derived from the schema's typeName.
 * For example, "user.v1.UserCreated" becomes subject "user.v1.user-created"
 *
 * @throws Error if NATS is not connected or schema is invalid
 */
export declare function publish<T extends Message>(client: NatsClient, logger: Logger, source: string, schema: GenMessage<T>, data: T, options?: PublishOptions): Promise<void>;
//# sourceMappingURL=publish.d.ts.map