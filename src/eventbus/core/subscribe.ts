import type { NatsClient } from '../client/nats-client';
import type { Logger } from 'pino';
import type { Subscription, Msg } from 'nats';
import type { Message } from '@bufbuild/protobuf';
import type { GenMessage } from '@bufbuild/protobuf/codegenv2';
import { fromBinary } from '@bufbuild/protobuf';
import { EventSchema, type Event } from '@nauticalstream/proto/platform/v1/event_pb';
import { withSubscribeSpan } from './telemetry';
import { deriveSubject } from '../utils/derive-subject';
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
export async function subscribe<T extends Message>(
  client: NatsClient,
  logger: Logger,
  schema: GenMessage<T>,
  handler: (data: T, envelope: Event) => Promise<void>
): Promise<Unsubscribe> {
  const subject = deriveSubject(schema.typeName);
  
  if (!client.connected) {
    throw new Error('NATS not connected - cannot subscribe');
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
