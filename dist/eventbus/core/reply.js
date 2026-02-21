import { fromBinary, toBinary, create } from '@bufbuild/protobuf';
import { EventSchema } from '@nauticalstream/proto/platform/v1/event_pb';
/**
 * Subscribe to a request/reply subject (RPC server side)
 * Inbound binary is decoded as platform.v1.Event.
 * Response is re-wrapped in a new Event echoing the inbound correlationId.
 * Core NATS - synchronous RPC pattern (server side)
 */
export async function reply(client, logger, config) {
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
                    const inboundEnvelope = fromBinary(EventSchema, msg.data);
                    inboundCorrelationId = inboundEnvelope.correlationId;
                    const data = fromBinary(reqSchema, inboundEnvelope.payload);
                    logger.debug({ subject, correlationId: inboundCorrelationId }, 'Processing request');
                    const response = await handler(data, inboundEnvelope);
                    // Echo the inbound correlationId so callers can correlate the pair
                    const responseEnvelope = create(EventSchema, {
                        type: subject,
                        source,
                        correlationId: inboundCorrelationId,
                        timestamp: new Date().toISOString(),
                        payload: toBinary(respSchema, response),
                    });
                    msg.respond(toBinary(EventSchema, responseEnvelope));
                }
                catch (error) {
                    logger.error({ error, subject }, 'Request handler failed');
                    // Respond with an empty-payload envelope so the caller can detect the error
                    const errorEnvelope = create(EventSchema, {
                        type: `${subject}.error`,
                        source,
                        correlationId: inboundCorrelationId ?? crypto.randomUUID(),
                        timestamp: new Date().toISOString(),
                    });
                    msg.respond(toBinary(EventSchema, errorEnvelope));
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