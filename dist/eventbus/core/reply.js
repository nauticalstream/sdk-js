"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reply = reply;
const protobuf_1 = require("@bufbuild/protobuf");
const event_pb_1 = require("@nauticalstream/proto/platform/v1/event_pb");
/**
 * Subscribe to a request/reply subject (RPC server side)
 * Inbound binary is decoded as platform.v1.Event.
 * Response is re-wrapped in a new Event echoing the inbound correlationId.
 * Core NATS - synchronous RPC pattern (server side)
 */
async function reply(client, logger, config) {
    const { subject, source, reqSchema, respSchema, handler } = config;
    try {
        if (!client.connected) {
            logger.warn({ subject }, 'NATS not connected - cannot subscribe to requests');
            return async () => { };
        }
        const connection = client.getConnection();
        logger.info({ subject }, 'Subscribing to request/reply subject');
        const subscription = connection.subscribe(subject, {
            callback: async (err, msg) => {
                if (err) {
                    logger.error({ err, subject }, 'Request subscription error');
                    return;
                }
                let inboundCorrelationId;
                try {
                    const inboundEnvelope = (0, protobuf_1.fromBinary)(event_pb_1.EventSchema, msg.data);
                    inboundCorrelationId = inboundEnvelope.correlationId;
                    const data = (0, protobuf_1.fromBinary)(reqSchema, inboundEnvelope.payload);
                    logger.debug({ subject, correlationId: inboundCorrelationId }, 'Processing request');
                    const response = await handler(data, inboundEnvelope);
                    // Echo the inbound correlationId so callers can correlate the pair
                    const responseEnvelope = (0, protobuf_1.create)(event_pb_1.EventSchema, {
                        type: subject,
                        source,
                        correlationId: inboundCorrelationId,
                        timestamp: new Date().toISOString(),
                        payload: (0, protobuf_1.toBinary)(respSchema, response),
                    });
                    msg.respond((0, protobuf_1.toBinary)(event_pb_1.EventSchema, responseEnvelope));
                }
                catch (error) {
                    logger.error({ error, subject }, 'Request handler failed');
                    // Respond with an empty-payload envelope so the caller can detect the error
                    const errorEnvelope = (0, protobuf_1.create)(event_pb_1.EventSchema, {
                        type: `${subject}.error`,
                        source,
                        correlationId: inboundCorrelationId ?? crypto.randomUUID(),
                        timestamp: new Date().toISOString(),
                    });
                    msg.respond((0, protobuf_1.toBinary)(event_pb_1.EventSchema, errorEnvelope));
                }
            }
        });
        logger.info({ subject }, 'Request/reply subscription established');
        // Cleanup function
        return async () => {
            try {
                subscription.unsubscribe();
                logger.info({ subject }, 'Request/reply subscription closed');
            }
            catch (err) {
                logger.error({ err, subject }, 'Error during request subscription shutdown');
            }
        };
    }
    catch (err) {
        logger.error({ err, subject }, 'Failed to subscribe to request/reply subject');
        return async () => { };
    }
}
//# sourceMappingURL=reply.js.map