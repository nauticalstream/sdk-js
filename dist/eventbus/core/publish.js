import { buildEnvelope } from './envelope';
/**
 * Publish message to subject (ephemeral, fire-and-forget)
 * Core NATS - fast, no persistence
 * Payload is automatically wrapped in a platform.v1.Event envelope.
 */
export async function publish(client, logger, source, subject, schema, data, correlationId) {
    const connection = client.getConnection();
    const { binary, event, headers } = buildEnvelope(source, subject, schema, data, correlationId);
    connection.publish(subject, binary, { headers });
    logger.debug({ subject, correlationId: event.correlationId }, 'Published to core NATS');
}
//# sourceMappingURL=publish.js.map