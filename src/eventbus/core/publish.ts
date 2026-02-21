import type { NatsClient } from '../client/nats-client';
import type { Logger } from 'pino';
import { create, type Message, type MessageInitShape } from '@bufbuild/protobuf';
import type { GenMessage } from '@bufbuild/protobuf/codegenv2';
import { buildEnvelope } from './envelope';
import { deriveSubject } from '../utils/derive-subject';
import type { PublishOptions } from './types';

/**
 * Publish message to subject (ephemeral, fire-and-forget)
 * Core NATS - fast, no persistence
 * Payload is automatically wrapped in a platform.v1.Event envelope.
 * 
 * The NATS subject is automatically derived from the schema's typeName.
 * For example, "user.v1.UserCreated" becomes subject "user.v1.user-created"
 * 
 * @throws Error if NATS is not connected or schema is invalid
 */
export async function publish<T extends Message>(
  client: NatsClient,
  logger: Logger,
  source: string,
  schema: GenMessage<T>,
  data: MessageInitShape<GenMessage<T>>,
  options?: PublishOptions
): Promise<void> {
  if (!client.connected) {
    throw new Error('NATS not connected - cannot publish message');
  }

  const subject = deriveSubject(schema.typeName);
  const connection = client.getConnection();
  const message = create(schema, data);
  const { binary, event, headers } = buildEnvelope(source, subject, schema, message, options?.correlationId);
  
  connection.publish(subject, binary, { headers });
  logger.debug({ subject, correlationId: event.correlationId }, 'Published to core NATS');
}
