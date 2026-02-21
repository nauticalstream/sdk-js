import { fromBinary, toBinary, create } from '@bufbuild/protobuf';
import { EventSchema } from '@nauticalstream/proto/platform/v1/event_pb';
import { withCorrelationId, generateCorrelationId } from '../../telemetry/utils/context';
import { deriveSubject } from '../utils/derive-subject';
/**
 * Subscribe to a request/reply subject (RPC server side)
 * Inbound binary is decoded as platform.v1.Event.
 * Response is re-wrapped in a new Event echoing the inbound correlationId.
 * Core NATS - synchronous RPC pattern (server side)
 *
 * The NATS subject is automatically derived from the request schema's typeName.
 * For example, "user.v1.GetUserRequest" becomes subject "user.v1.get-user-request"
 *
 * @throws Error if NATS is not connected or schema is invalid
 */
export async function reply(client, logger, config) {
    const { source, reqSchema, respSchema, handler } = config;
    const subject = deriveSubject(reqSchema.typeName);
    if (!client.connected) {
        throw new Error('NATS not connected - cannot subscribe to requests');
    }
    try {
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
                    const responseData = await withCorrelationId(inboundCorrelationId ?? generateCorrelationId(), () => handler(data, inboundEnvelope));
                    const response = create(respSchema, responseData);
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
                    // Error Signaling: Send empty payload envelope to indicate handler failure
                    // This allows caller to fail fast instead of waiting for timeout
                    // Caller checks payload.length === 0 to detect error and throw
                    const errorEnvelope = create(EventSchema, {
                        type: `${subject}.error`,
                        source,
                        correlationId: inboundCorrelationId ?? generateCorrelationId(),
                        timestamp: new Date().toISOString(),
                    });
                    msg.respond(toBinary(EventSchema, errorEnvelope));
                }
            }
        });
        logger.info({ subject }, 'Request/reply subscription established');
        // Cleanup function
        return () => {
            subscription.unsubscribe();
            logger.info({ subject }, 'Request/reply subscription closed');
        };
    }
    catch (err) {
        logger.error({ err, subject }, 'Failed to subscribe to request/reply subject');
        throw new Error(`Failed to subscribe to request/reply subject ${subject}: ${err}`);
    }
}
//# sourceMappingURL=reply.js.map