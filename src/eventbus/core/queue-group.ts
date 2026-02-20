import type { NatsClient } from '../client/nats-client';
import type { Logger } from 'pino';
import type { Subscription, Msg } from 'nats';
import type { Message } from '@bufbuild/protobuf';
import type { GenMessage } from '@bufbuild/protobuf/codegenv2';
import { fromBinary } from '@bufbuild/protobuf';
import { EventSchema, type Event } from '@nauticalstream/proto/platform/v1/event_pb';
import { withSubscribeSpan } from './telemetry';

/**
 * Subscribe with queue group (load balancing)
 * Only one member of the queue group receives each message.
 * Incoming binary is decoded as platform.v1.Event; payload is deserialized using the provided schema.
 * Core NATS - fast, ephemeral, load-balanced
 */
export async function queueGroup<T extends Message>(
  client: NatsClient,
  logger: Logger,
  subject: string,
  queueGroupName: string,
  schema: GenMessage<T>,
  handler: (data: T, envelope: Event) => Promise<void>
): Promise<() => void> {
  if (!client.connected) {
    logger.warn({ subject, queueGroup: queueGroupName }, 'NATS not connected');
    return () => {};
  }

  const connection = client.getConnection();

  logger.info({ subject, queueGroup: queueGroupName }, 'Subscribing to queue group');

  const subscription: Subscription = connection.subscribe(subject, {
    queue: queueGroupName,
    callback: async (err: Error | null, msg: Msg) => {
      if (err) {
        logger.error({ err, subject, queueGroup: queueGroupName }, 'Queue group error');
        return;
      }

      try {
        const envelope = fromBinary(EventSchema, msg.data) as Event;
        const data = fromBinary(schema, envelope.payload) as T;
        await withSubscribeSpan(subject, msg.headers ?? undefined, () => handler(data, envelope));
      } catch (error) {
        logger.error({ error, subject, queueGroup: queueGroupName }, 'Handler failed');
      }
    }
  });

  logger.info({ subject, queueGroup: queueGroupName }, 'Queue group subscription established');

  return () => {
    subscription.unsubscribe();
    logger.info({ subject, queueGroup: queueGroupName }, 'Queue group subscription closed');
  };
}
