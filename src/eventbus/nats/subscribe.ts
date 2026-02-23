import { fromJson, type Message } from '@bufbuild/protobuf';
import type { GenMessage } from '@bufbuild/protobuf/codegenv2';
import type { Subscription, Msg } from 'nats';
import type { Logger } from 'pino';
import type { NatsClient } from '../client/nats-client';
import { parseEnvelope, type Event } from '../envelope';
import { withSubscribeSpan } from '../observability/tracing';
import { withCorrelationId, generateCorrelationId } from '../../telemetry/utils/context';
import { deriveSubject } from '../utils/derive-subject';
import type { Unsubscribe } from '../types';

/**
 * Subscribe to a NATS Core subject (ephemeral — no persistence).
 * Incoming bytes are decoded as platform.v1.Event; domain data is deserialized via schema.
 * Subject is auto-derived from schema.typeName.
 * Handler errors are caught and logged — they do not crash the subscription.
 *
 * @throws if NATS is disconnected at subscribe time.
 */
export async function subscribe<T extends Message>(
  client: NatsClient,
  logger: Logger,
  schema: GenMessage<T>,
  handler: (data: T, envelope: Event) => Promise<void>
): Promise<Unsubscribe> {
  if (!client.connected) throw new Error('NATS not connected — cannot subscribe');

  const subject = deriveSubject(schema.typeName);
  logger.info({ subject }, 'Subscribing to NATS Core subject');

  const subscription: Subscription = client.getConnection().subscribe(subject, {
    callback: async (err: Error | null, msg: Msg) => {
      if (err) { logger.error({ err, subject }, 'Subscription error'); return; }

      try {
        const envelope = parseEnvelope(msg.data);
        const data = fromJson(schema, envelope.data ?? {}) as T;
        await withSubscribeSpan(subject, msg.headers ?? undefined, () =>
          withCorrelationId(envelope.correlationId || generateCorrelationId(), () => handler(data, envelope))
        );
      } catch (error) {
        logger.error({ error, subject }, 'Handler failed');
      }
    },
  });

  logger.info({ subject }, 'NATS Core subscription established');
  return () => {
    subscription.unsubscribe();
    logger.info({ subject }, 'NATS Core subscription closed');
  };
}
