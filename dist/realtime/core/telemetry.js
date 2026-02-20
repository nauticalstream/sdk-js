"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPublishProperties = createPublishProperties;
exports.withPublishSpan = withPublishSpan;
exports.withMessageSpan = withMessageSpan;
const api_1 = require("@opentelemetry/api");
const TRACER_NAME = '@nauticalstream/realtime';
/**
 * TextMap carrier adapters for MQTT User Properties
 * MQTT v5 userProperties is Record<string, string | string[]>
 * OTel propagation injects/extracts trace context via string key/value pairs.
 */
const setter = {
    set(carrier, key, value) {
        carrier[key] = value;
    },
};
const getter = {
    get(carrier, key) {
        if (!carrier)
            return undefined;
        const value = carrier[key];
        if (typeof value === 'string')
            return value;
        if (Array.isArray(value))
            return value[0];
        return undefined;
    },
    keys(carrier) {
        return carrier ? Object.keys(carrier) : [];
    },
};
/**
 * Create MQTT User Properties with trace context and correlation metadata
 * Returns Record<string, string> for MQTT v5 userProperties
 *
 * If no OTel SDK is registered, trace context injection is a silent no-op.
 * Correlation ID and timestamp are always added for log correlation.
 *
 * @param correlationId - Unique ID for message tracing across services
 * @param source - Optional service name that published the message
 */
function createPublishProperties(correlationId, source) {
    const properties = {
        'x-correlation-id': correlationId,
        'x-timestamp': new Date().toISOString(),
    };
    if (source) {
        properties['x-source'] = source;
    }
    // Inject OTel trace context (silent no-op if no SDK registered)
    api_1.propagation.inject(api_1.context.active(), properties, setter);
    return properties;
}
/**
 * Wrap a publish operation in an OTel producer span
 * Records topic, message size, and any errors
 *
 * If no OTel SDK is registered, this is a silent no-op wrapper.
 *
 * @param topic - MQTT topic being published to
 * @param messageSize - Size of the message payload in bytes
 * @param fn - Async function to execute within the span
 */
async function withPublishSpan(topic, messageSize, fn) {
    const tracer = api_1.trace.getTracer(TRACER_NAME);
    const span = tracer.startSpan(`publish ${topic}`, {
        kind: api_1.SpanKind.PRODUCER,
        attributes: {
            'messaging.system': 'mqtt',
            'messaging.destination': topic,
            'messaging.message.payload_size_bytes': messageSize,
        },
    });
    return api_1.context.with(api_1.trace.setSpan(api_1.context.active(), span), async () => {
        try {
            await fn();
            span.setStatus({ code: api_1.SpanStatusCode.OK });
        }
        catch (err) {
            span.setStatus({ code: api_1.SpanStatusCode.ERROR });
            if (err instanceof Error)
                span.recordException(err);
            throw err;
        }
        finally {
            span.end();
        }
    });
}
/**
 * Wrap a message handler in an OTel consumer span
 * Extracts trace context from MQTT userProperties and creates a child span
 *
 * If no OTel SDK is registered, this is a silent no-op wrapper.
 *
 * @param topic - MQTT topic the message was received on
 * @param userProperties - MQTT v5 userProperties containing trace context
 * @param fn - Async function to execute within the span
 */
async function withMessageSpan(topic, userProperties, fn) {
    const parentCtx = api_1.propagation.extract(api_1.context.active(), userProperties, getter);
    const tracer = api_1.trace.getTracer(TRACER_NAME);
    const span = tracer.startSpan(`receive ${topic}`, {
        kind: api_1.SpanKind.CONSUMER,
        attributes: {
            'messaging.system': 'mqtt',
            'messaging.destination': topic,
        },
    }, parentCtx);
    return api_1.context.with(api_1.trace.setSpan(parentCtx, span), async () => {
        try {
            await fn();
            span.setStatus({ code: api_1.SpanStatusCode.OK });
        }
        catch (err) {
            span.setStatus({ code: api_1.SpanStatusCode.ERROR });
            if (err instanceof Error)
                span.recordException(err);
            throw err;
        }
        finally {
            span.end();
        }
    });
}
//# sourceMappingURL=telemetry.js.map