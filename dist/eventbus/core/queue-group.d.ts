import type { NatsClient } from '../client/nats-client';
import type { Logger } from 'pino';
import type { Message } from '@bufbuild/protobuf';
import type { GenMessage } from '@bufbuild/protobuf/codegenv2';
import { type Event } from '@nauticalstream/proto/platform/v1/event_pb';
/**
 * Subscribe with queue group (load balancing)
 * Only one member of the queue group receives each message.
 * Incoming binary is decoded as platform.v1.Event; payload is deserialized using the provided schema.
 * Core NATS - fast, ephemeral, load-balanced
 */
export declare function queueGroup<T extends Message>(client: NatsClient, logger: Logger, subject: string, queueGroupName: string, schema: GenMessage<T>, handler: (data: T, envelope: Event) => Promise<void>): Promise<() => void>;
//# sourceMappingURL=queue-group.d.ts.map