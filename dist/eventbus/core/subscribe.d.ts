import type { NatsClient } from '../client/nats-client';
import type { Logger } from 'pino';
import type { Message } from '@bufbuild/protobuf';
import type { GenMessage } from '@bufbuild/protobuf/codegenv2';
import { type Event } from './envelope';
import type { Unsubscribe } from './types';
/**
 * Subscribe to subject (ephemeral)
 * Core NATS - fast, no persistence
 * Incoming binary is decoded as platform.v1.Event; payload is deserialized using the provided schema.
 * Handler receives the typed payload and the full envelope (for correlationId propagation if needed).
 *
 * The NATS subject is automatically derived from the schema's typeName.
 * For example, "user.v1.UserCreated" becomes subject "user.v1.user-created"
 *
 * @throws Error if NATS is not connected or schema is invalid
 */
export declare function subscribe<T extends Message>(client: NatsClient, logger: Logger, schema: GenMessage<T>, handler: (data: T, envelope: Event) => Promise<void>): Promise<Unsubscribe>;
//# sourceMappingURL=subscribe.d.ts.map