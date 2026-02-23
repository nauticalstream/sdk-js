import { toJson, toJsonString, fromJsonString, create } from '@bufbuild/protobuf';
import { EventSchema } from '@nauticalstream/proto/platform/v1/event_pb';
import { createPublishHeaders } from './telemetry';
import { getCorrelationId } from '../../telemetry/utils/context';
const encoder = new TextEncoder();
const decoder = new TextDecoder();
/**
 * Build a platform.v1.Event envelope around any proto message.
 * - type          = subject (NATS subject is the event type)
 * - source        = service name (set once at EventBus construction)
 * - correlationId = caller-supplied for chaining, auto UUID otherwise
 * - timestamp     = current UTC ISO string
 * - data          = toJson(schema, data) as JsonObject — fully human-readable on the wire
 * - headers       = NATS headers with OTel trace context injected
 *
 * Wire encoding: toJsonString(EventSchema, event) → UTF-8 bytes
 */
export function buildEnvelope(source, subject, schema, data, correlationId) {
    const resolvedCorrelationId = correlationId ?? getCorrelationId();
    const event = create(EventSchema, {
        type: subject,
        source,
        correlationId: resolvedCorrelationId,
        timestamp: new Date().toISOString(),
        data: toJson(schema, data),
    });
    return {
        event,
        binary: encoder.encode(toJsonString(EventSchema, event)),
        headers: createPublishHeaders(resolvedCorrelationId),
    };
}
/**
 * Parse raw NATS message bytes into a platform.v1.Event.
 */
export function parseEnvelope(raw) {
    return fromJsonString(EventSchema, decoder.decode(raw));
}
//# sourceMappingURL=envelope.js.map