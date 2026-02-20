import type { NatsClient } from '../client/nats-client';
import type { Logger } from 'pino';
import type { Subscription, Msg } from 'nats';
import type { Message } from '@bufbuild/protobuf';
import type { GenMessage } from '@bufbuild/protobuf/codegenv2';
import { fromBinary } from '@bufbuild/protobuf';
import { EventSchema, type Event } from '@nauticalstream/proto/platform/v1/event_pb';
import { withSubscribeSpan } from './telemetry';

/**
 * Subscribe to subject (ephemeral)
 * Core NATS - fast, no persistence
 * Incoming binary is decoded as platform.v1.Event; payload is deserialized using the provided schema.
 * Handler receives the typed payload and the full envelope (for correlationId propagation if needed).
 */
export async function subscribe<T extends Message>(
  client: NatsClient,
  logger: Logger,
  subject: string,
  schema: GenMessage<T>,
  handler: (data: T, envelope: Event) => Promise<void>
): Promise<() => void> {
  if (!client.connected) {
    logger.warn({ subject }, 'NATS not connected');
    return () => {};
  }

  const connection = client.getConnection();

  logger.info({ subject }, 'Subscribing to core NATS subject');

  const subscription: Subscription = connection.subscribe(subject, {
    callback: async (err: Error | null, msg: Msg) => {
      if (err) {
        logger.error({ err, subject }, 'Subscription error');
        return;
      }

      try {
        const envelope = fromBinary(EventSchema, msg.data) as Event;
        const data = fromBinary(schema, envelope.payload) as T;
        await withSubscribeSpan(subject, msg.headers ?? undefined, () => handler(data, envelope));
      } catch (error) {
        logger.error({ error, subject }, 'Handler failed');
      }
    }
  });

  logger.info({ subject }, 'Core NATS subscription established');

  return () => {
    subscription.unsubscribe();
    logger.info({ subject }, 'Core NATS subscription closed');
  };
}
