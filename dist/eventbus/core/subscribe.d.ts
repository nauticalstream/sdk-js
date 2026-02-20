import type { NatsClient } from '../client/nats-client';
import type { Logger } from 'pino';
import type { Message } from '@bufbuild/protobuf';
import type { GenMessage } from '@bufbuild/protobuf/codegenv2';
import { type Event } from '@nauticalstream/proto/platform/v1/event_pb';
/**
 * Subscribe to subject (ephemeral)
 * Core NATS - fast, no persistence
 * Incoming binary is decoded as platform.v1.Event; payload is deserialized using the provided schema.
 * Handler receives the typed payload and the full envelope (for correlationId propagation if needed).
 */
export declare function subscribe<T extends Message>(client: NatsClient, logger: Logger, subject: string, schema: GenMessage<T>, handler: (data: T, envelope: Event) => Promise<void>): Promise<() => void>;
//# sourceMappingURL=subscribe.d.ts.map