import { type Message, type MessageInitShape } from '@bufbuild/protobuf';
import type { GenMessage } from '@bufbuild/protobuf/codegenv2';
import type { Logger } from 'pino';
import type { NatsClient } from '../client/nats-client';
import { buildEnvelope } from '../envelope';
import { deriveSubject } from '../utils/derive-subject';
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

  const subject = deriveSubject(schema.typeName);
  const { binary, event, headers } = buildEnvelope(source, subject, schema, data, options?.correlationId);

  client.getConnection().publish(subject, binary, { headers });
  logger.debug({ subject, correlationId: event.correlationId }, 'Published to NATS Core');
}
