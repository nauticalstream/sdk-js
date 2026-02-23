import { type Message, type MessageInitShape } from '@bufbuild/protobuf';
import type { GenMessage } from '@bufbuild/protobuf/codegenv2';
import type { Logger } from 'pino';
import type { NatsClient } from '../client/nats-client';
import { buildEnvelope } from '../envelope';
import type { PublishOptions } from '../types';

/**
 * Publish a proto message to a NATS Core subject (ephemeral, fire-and-forget).
 * The message is wrapped in a platform.v1.Event envelope and JSON-encoded on the wire.
 * Subject is auto-derived from schema.typeName (e.g. "user.v1.UserCreated" → "user.v1.user-created").
 *
 * @throws if NATS is disconnected.
 */
export async function publish<T extends Message>(
  client: NatsClient,
  logger: Logger,
  source: string,
  schema: GenMessage<T>,
  data: MessageInitShape<GenMessage<T>>,
  options?: PublishOptions
): Promise<void> {
  if (!client.connected) throw new Error('NATS not connected — cannot publish');

  const { payload, event, headers } = buildEnvelope(source, schema, data, { correlationId: options?.correlationId });
  const subject = event.type;

  client.getConnection().publish(subject, payload, { headers });
  logger.debug({ subject, correlationId: event.correlationId }, 'Published to NATS Core');
}
