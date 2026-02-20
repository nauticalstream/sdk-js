"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.subscribe = subscribe;
const protobuf_1 = require("@bufbuild/protobuf");
const event_pb_1 = require("@nauticalstream/proto/platform/v1/event_pb");
const telemetry_1 = require("./telemetry");
/**
 * Subscribe to subject (ephemeral)
 * Core NATS - fast, no persistence
 * Incoming binary is decoded as platform.v1.Event; payload is deserialized using the provided schema.
 * Handler receives the typed payload and the full envelope (for correlationId propagation if needed).
 */
async function subscribe(client, logger, subject, schema, handler) {
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
                const envelope = (0, protobuf_1.fromBinary)(event_pb_1.EventSchema, msg.data);
                const data = (0, protobuf_1.fromBinary)(schema, envelope.payload);
                await (0, telemetry_1.withSubscribeSpan)(subject, msg.headers ?? undefined, () => handler(data, envelope));
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