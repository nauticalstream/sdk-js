import { fromJson, create, toJsonString } from '@bufbuild/protobuf';
import { EventSchema } from '@nauticalstream/proto/platform/v1/event_pb';
import { withCorrelationId, generateCorrelationId } from '../../telemetry/utils/context';
import { deriveSubject } from '../utils/derive-subject';
import { parseEnvelope, buildEnvelope } from './envelope';
const encoder = new TextEncoder();
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
                    const inboundEnvelope = parseEnvelope(msg.data);
                    inboundCorrelationId = inboundEnvelope.correlationId;
                    const data = fromJson(reqSchema, inboundEnvelope.data ?? {});
                    logger.debug({ subject, correlationId: inboundCorrelationId }, 'Processing request');
                    const responseData = await withCorrelationId(inboundCorrelationId ?? generateCorrelationId(), () => handler(data, inboundEnvelope));
                    const response = create(respSchema, responseData);
                    // Echo the inbound correlationId so callers can correlate the pair
                    const { binary: responseBinary } = buildEnvelope(source, subject, respSchema, response, inboundCorrelationId ?? generateCorrelationId());
                    msg.respond(responseBinary);
                }
                catch (error) {
                    logger.error({ error, subject }, 'Request handler failed');
                    // Error signaling: undefined data signals handler failure to caller
                    const errorEvent = create(EventSchema, {
                        type: `${subject}.error`,
                        source,
                        correlationId: inboundCorrelationId ?? generateCorrelationId(),
                        timestamp: new Date().toISOString(),
                        // data intentionally omitted — undefined signals error to request() caller
                    });
                    msg.respond(encoder.encode(toJsonString(EventSchema, errorEvent)));
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