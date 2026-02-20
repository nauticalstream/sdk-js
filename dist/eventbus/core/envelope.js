"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildEnvelope = buildEnvelope;
const protobuf_1 = require("@bufbuild/protobuf");
const event_pb_1 = require("@nauticalstream/proto/platform/v1/event_pb");
const telemetry_1 = require("./telemetry");
/**
 * Build a platform.v1.Event envelope around any proto message.
 * - type          = subject (NATS subject is the event type)
 * - source        = service name (set once at EventBus construction)
 * - correlationId = caller-supplied for chaining, auto UUID otherwise
 * - timestamp     = current UTC ISO string
 * - payload       = toBinary(schema, data)
 * - headers       = NATS headers with OTel trace context injected (no-op if no SDK registered)
 */
function buildEnvelope(source, subject, schema, data, correlationId) {
    const resolvedCorrelationId = correlationId ?? crypto.randomUUID();
    const event = (0, protobuf_1.create)(event_pb_1.EventSchema, {
        type: subject,
        source,
        correlationId: resolvedCorrelationId,
        timestamp: new Date().toISOString(),
        payload: (0, protobuf_1.toBinary)(schema, data),
    });
    return {
        event,
        binary: (0, protobuf_1.toBinary)(event_pb_1.EventSchema, event),
        headers: (0, telemetry_1.createPublishHeaders)(resolvedCorrelationId),
    };
}
//# sourceMappingURL=envelope.js.map