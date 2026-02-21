import { fromBinary } from '@bufbuild/protobuf';
import { EventSchema } from '@nauticalstream/proto/platform/v1/event_pb';
import { withSubscribeSpan } from './telemetry';
import { withCorrelationId, generateCorrelationId } from '../../telemetry/utils/context';
import { deriveSubject } from '../utils/derive-subject';
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
export async function subscribe(client, logger, schema, handler) {
    const subject = deriveSubject(schema.typeName);
    if (!client.connected) {
        throw new Error('NATS not connected - cannot subscribe');
    }
    const connection = client.getConnection();
    logger.info({ subject }, 'Subscribing to core NATS subject');
    const subscription = connection.subscribe(subject, {
        callback: async (err, msg) => {
            if (err) {
                logger.error({ err, subject }, 'Subscription error');
                return;
            }
            try {
                const envelope = fromBinary(EventSchema, msg.data);
                const data = fromBinary(schema, envelope.payload);
                await withSubscribeSpan(subject, msg.headers ?? undefined, () => withCorrelationId(envelope.correlationId || generateCorrelationId(), () => handler(data, envelope)));
            }
            catch (error) {
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
//# sourceMappingURL=subscribe.js.map