"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.request = request;
const protobuf_1 = require("@bufbuild/protobuf");
const event_pb_1 = require("@nauticalstream/proto/platform/v1/event_pb");
const envelope_1 = require("./envelope");
/**
 * Make a request/reply call to another service (RPC pattern)
 * Request and response are both wrapped in platform.v1.Event envelopes.
 * Core NATS - synchronous RPC pattern
 */
async function request(client, logger, source, subject, reqSchema, respSchema, data, timeoutMs = 5000) {
    try {
        if (!client.connected) {
            logger.warn({ subject }, 'NATS not connected - cannot make request');
            return null;
        }
        const connection = client.getConnection();
        const message = (0, protobuf_1.create)(reqSchema, data);
        const { binary, event } = (0, envelope_1.buildEnvelope)(source, subject, reqSchema, message);
        logger.debug({ subject, correlationId: event.correlationId }, 'Making NATS request');
        const response = await connection.request(subject, binary, { timeout: timeoutMs });
        const responseEnvelope = (0, protobuf_1.fromBinary)(event_pb_1.EventSchema, response.data);
        // Empty payload means the responder signalled an error
        if (responseEnvelope.payload.length === 0) {
            logger.warn({ subject, correlationId: responseEnvelope.correlationId }, 'Request returned error response');
            return null;
        }
        const result = (0, protobuf_1.fromBinary)(respSchema, responseEnvelope.payload);
        logger.debug({ subject, correlationId: responseEnvelope.correlationId }, 'Request completed successfully');
        return result;
    }
    catch (err) {
        logger.warn({ subject, error: err }, 'Request failed');
        return null;
    }
}
//# sourceMappingURL=request.js.map