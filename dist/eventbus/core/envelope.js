import { create, toBinary } from '@bufbuild/protobuf';
import { EventSchema } from '@nauticalstream/proto/platform/v1/event_pb';
import { createPublishHeaders } from './telemetry';
/**
 * Build a platform.v1.Event envelope around any proto message.
 * - type          = subject (NATS subject is the event type)
 * - source        = service name (set once at EventBus construction)
 * - correlationId = caller-supplied for chaining, auto UUID otherwise
 * - timestamp     = current UTC ISO string
 * - payload       = toBinary(schema, data)
 * - headers       = NATS headers with OTel trace context injected (no-op if no SDK registered)
 */
export function buildEnvelope(source, subject, schema, data, correlationId) {
    const resolvedCorrelationId = correlationId ?? crypto.randomUUID();
    const event = create(EventSchema, {
        type: subject,
        source,
        correlationId: resolvedCorrelationId,
        timestamp: new Date().toISOString(),
        payload: toBinary(schema, data),
    });
    return {
        event,
        binary: toBinary(EventSchema, event),
        headers: createPublishHeaders(resolvedCorrelationId),
    };
}
//# sourceMappingURL=envelope.js.map