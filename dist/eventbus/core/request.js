import { create, fromBinary } from '@bufbuild/protobuf';
import { EventSchema } from '@nauticalstream/proto/platform/v1/event_pb';
import { buildEnvelope } from './envelope';
import { deriveSubject } from '../utils/derive-subject';
import { DEFAULT_REQUEST_TIMEOUT_MS } from './config';
/**
 * Make a request/reply call to another service (RPC pattern)
 * Request and response are both wrapped in platform.v1.Event envelopes.
 * Core NATS - synchronous RPC pattern
 *
 * The NATS subject is automatically derived from the request schema's typeName.
 * For example, "user.v1.GetUserRequest" becomes subject "user.v1.get-user-request"
 *
 * @throws Error if NATS is not connected, request times out, or receives error response
 */
export async function request(client, logger, source, reqSchema, respSchema, data, options) {
    const subject = deriveSubject(reqSchema.typeName);
    const timeoutMs = options?.timeoutMs ?? DEFAULT_REQUEST_TIMEOUT_MS;
    if (!client.connected) {
        throw new Error('NATS not connected - cannot make request');
    }
    const connection = client.getConnection();
    const message = create(reqSchema, data);
    const { binary, event } = buildEnvelope(source, subject, reqSchema, message, options?.correlationId);
    logger.debug({ subject, correlationId: event.correlationId }, 'Making NATS request');
    try {
        const response = await connection.request(subject, binary, { timeout: timeoutMs });
        const responseEnvelope = fromBinary(EventSchema, response.data);
        // Empty payload means the responder signalled an error
        if (responseEnvelope.payload.length === 0) {
            throw new Error(`Request to ${subject} returned error response`);
            ;
        }
        const result = fromBinary(respSchema, responseEnvelope.payload);
        logger.debug({ subject, correlationId: responseEnvelope.correlationId }, 'Request completed successfully');
        return result;
    }
    catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        logger.error({ subject, error: err }, 'Request failed');
        throw new Error(`Request to ${subject} failed: ${errorMessage}`);
    }
}
//# sourceMappingURL=request.js.map