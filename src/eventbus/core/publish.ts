import type { NatsClient } from '../client/nats-client';
import type { Logger } from 'pino';
import type { Message } from '@bufbuild/protobuf';
import type { GenMessage } from '@bufbuild/protobuf/codegenv2';
import { buildEnvelope } from './envelope';

/**
 * Publish message to subject (ephemeral, fire-and-forget)
 * Core NATS - fast, no persistence
 * Payload is automatically wrapped in a platform.v1.Event envelope.
 */
export async function publish<T extends Message>(
  client: NatsClient,
  logger: Logger,
  source: string,
  subject: string,
  schema: GenMessage<T>,
  data: T,
  correlationId?: string
): Promise<void> {
  const connection = client.getConnection();
  const { binary, event, headers } = buildEnvelope(source, subject, schema, data, correlationId);
  connection.publish(subject, binary, { headers });
  logger.debug({ subject, correlationId: event.correlationId }, 'Published to core NATS');
}
