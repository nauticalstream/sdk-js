import { fromBinary } from '@bufbuild/protobuf';
import { EventSchema } from '@nauticalstream/proto/platform/v1/event_pb';
import { withSubscribeSpan } from './telemetry';
/**
 * Subscribe to subject (ephemeral)
 * Core NATS - fast, no persistence
 * Incoming binary is decoded as platform.v1.Event; payload is deserialized using the provided schema.
 * Handler receives the typed payload and the full envelope (for correlationId propagation if needed).
 */
export async function subscribe(client, logger, subject, schema, handler) {
    if (!client.connected) {
        logger.warn({ subject }, 'NATS not connected');
        return () => { };
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
                await withSubscribeSpan(subject, msg.headers ?? undefined, () => handler(data, envelope));
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