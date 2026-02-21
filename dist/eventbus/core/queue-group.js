import { fromBinary } from '@bufbuild/protobuf';
import { EventSchema } from '@nauticalstream/proto/platform/v1/event_pb';
import { withSubscribeSpan } from './telemetry';
import { deriveSubject } from '../utils/derive-subject';
/**
 * Subscribe with queue group (load balancing)
 * Only one member of the queue group receives each message.
 * Incoming binary is decoded as platform.v1.Event; payload is deserialized using the provided schema.
 * Core NATS - fast, ephemeral, load-balanced
 *
 * The NATS subject is automatically derived from the schema's typeName.
 * For example, "user.v1.UserCreated" becomes subject "user.v1.user-created"
 *
 * @throws Error if NATS is not connected or schema is invalid
 */
export async function queueGroup(client, logger, schema, handler, options) {
    const subject = deriveSubject(schema.typeName);
    const { queueGroupName } = options;
    if (!client.connected) {
        throw new Error('NATS not connected - cannot subscribe to queue group');
    }
    const connection = client.getConnection();
    logger.info({ subject, queueGroup: queueGroupName }, 'Subscribing to queue group');
    const subscription = connection.subscribe(subject, {
        queue: queueGroupName,
        callback: async (err, msg) => {
            if (err) {
                logger.error({ err, subject, queueGroup: queueGroupName }, 'Queue group error');
                return;
            }
            try {
                const envelope = fromBinary(EventSchema, msg.data);
                const data = fromBinary(schema, envelope.payload);
                await withSubscribeSpan(subject, msg.headers ?? undefined, () => handler(data, envelope));
            }
            catch (error) {
                logger.error({ error, subject, queueGroup: queueGroupName }, 'Handler failed');
            }
        }
    });
    logger.info({ subject, queueGroup: queueGroupName }, 'Queue group subscription established');
    return () => {
        subscription.unsubscribe();
        logger.info({ subject, queueGroup: queueGroupName }, 'Queue group subscription closed');
    };
}
//# sourceMappingURL=queue-group.js.map