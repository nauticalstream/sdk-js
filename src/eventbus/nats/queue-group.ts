import { fromJson, type Message } from '@bufbuild/protobuf';
import type { GenMessage } from '@bufbuild/protobuf/codegenv2';
import type { Subscription, Msg } from 'nats';
import type { Logger } from 'pino';
import type { NatsClient } from '../client/nats-client';
import { parseEnvelope, type Event } from '../envelope';
import { withSubscribeSpan } from '../observability/tracing';
import { withCorrelationId, generateCorrelationId } from '../../telemetry/utils/context';
import { deriveSubject } from '../utils/derive-subject';
import type { QueueGroupOptions, Unsubscribe } from '../types';

/**
 * Subscribe with a NATS queue group (load-balanced, ephemeral).
 * Only one member of the group receives each message.
 * Incoming bytes are decoded as platform.v1.Event; domain data is deserialized via schema.
 * Subject is auto-derived from schema.typeName.
 *
 * @throws if NATS is disconnected at subscribe time.
 */
export async function queueGroup<T extends Message>(
  client: NatsClient,
  logger: Logger,
  schema: GenMessage<T>,
  handler: (data: T, envelope: Event) => Promise<void>,
  options: QueueGroupOptions
): Promise<Unsubscribe> {
  if (!client.connected) throw new Error('NATS not connected — cannot subscribe to queue group');

  const subject = deriveSubject(schema.typeName);
  const { queueGroupName } = options;

  logger.info({ subject, queueGroup: queueGroupName }, 'Subscribing to queue group');

  const subscription: Subscription = client.getConnection().subscribe(subject, {
    queue: queueGroupName,
    callback: async (err: Error | null, msg: Msg) => {
      if (err) { logger.error({ err, subject, queueGroup: queueGroupName }, 'Queue group error'); return; }

      try {
        const envelope = parseEnvelope(msg.data);
        const data = fromJson(schema, envelope.data ?? {}) as T;
        await withSubscribeSpan(subject, msg.headers ?? undefined, () =>
          withCorrelationId(envelope.correlationId || generateCorrelationId(), () => handler(data, envelope))
        );
      } catch (error) {
        logger.error({ error, subject, queueGroup: queueGroupName }, 'Handler failed');
      }
    },
  });

  logger.info({ subject, queueGroup: queueGroupName }, 'Queue group subscription established');
  return () => {
    subscription.unsubscribe();
    logger.info({ subject, queueGroup: queueGroupName }, 'Queue group subscription closed');
  };
}
