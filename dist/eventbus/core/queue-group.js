"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.queueGroup = queueGroup;
const protobuf_1 = require("@bufbuild/protobuf");
const event_pb_1 = require("@nauticalstream/proto/platform/v1/event_pb");
const telemetry_1 = require("./telemetry");
/**
 * Subscribe with queue group (load balancing)
 * Only one member of the queue group receives each message.
 * Incoming binary is decoded as platform.v1.Event; payload is deserialized using the provided schema.
 * Core NATS - fast, ephemeral, load-balanced
 */
async function queueGroup(client, logger, subject, queueGroupName, schema, handler) {
    if (!client.connected) {
        logger.warn({ subject, queueGroup: queueGroupName }, 'NATS not connected');
        return () => { };
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
                const envelope = (0, protobuf_1.fromBinary)(event_pb_1.EventSchema, msg.data);
                const data = (0, protobuf_1.fromBinary)(schema, envelope.payload);
                await (0, telemetry_1.withSubscribeSpan)(subject, msg.headers ?? undefined, () => handler(data, envelope));
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