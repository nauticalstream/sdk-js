import type { NatsClient } from '../client/nats-client';
import type { Logger } from 'pino';
import type { Message } from '@bufbuild/protobuf';
import type { GenMessage } from '@bufbuild/protobuf/codegenv2';
import { type Event } from './envelope';
import type { QueueGroupOptions, Unsubscribe } from './types';
/**
 * Subscribe with queue group (load balancing)
 * Only one member of the queue group receives each message.
 * Incoming binary is decoded as platform.v1.Event; payload is deserialized using the provided schema.
 * Core NATS - fast, ephemeral, load-balanced
 *
 * The NATS subject is automatically derived from the schema's typeName.
 * For example, "user.v1.UserCreated" becomes subject "user.v1.user-created"
 *
 * @throws Error if NATS is not connected or schema is invalid
 */
export declare function queueGroup<T extends Message>(client: NatsClient, logger: Logger, schema: GenMessage<T>, handler: (data: T, envelope: Event) => Promise<void>, options: QueueGroupOptions): Promise<Unsubscribe>;
//# sourceMappingURL=queue-group.d.ts.map