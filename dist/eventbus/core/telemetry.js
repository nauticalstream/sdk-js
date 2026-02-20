"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPublishHeaders = createPublishHeaders;
exports.withSubscribeSpan = withSubscribeSpan;
const api_1 = require("@opentelemetry/api");
const nats_1 = require("nats");
const TRACER_NAME = '@nauticalstream/eventbus';
/**
 * TextMap carrier adapters for NATS MsgHdrs
 * OTel propagation injects/extracts trace context via string key/value headers.
 */
const setter = {
    set(carrier, key, value) {
        carrier.set(key, value);
    },
};
const getter = {
    get(carrier, key) {
        return carrier?.get(key) ?? undefined;
    },
    keys(carrier) {
        if (!carrier)
            return [];
        return [...carrier.keys()];
    },
};
/**
 * Create NATS headers with OTel trace context injected.
 * Also carries the correlationId as a header for log correlation.
 * If no OTel SDK is registered this is a silent no-op and empty headers are returned.
 */
function createPublishHeaders(correlationId) {
    const h = (0, nats_1.headers)();
    h.set('x-correlation-id', correlationId);
    api_1.propagation.inject(api_1.context.active(), h, setter);
    return h;
}
/**
 * Wrap a subscribe handler in an OTel child span.
 * Extracts trace context from inbound NATS headers (propagated from the publisher).
 * Records exceptions and sets error status on failure.
 * If no OTel SDK is registered all calls are silent no-ops.
 */
async function withSubscribeSpan(subject, msgHeaders, fn) {
    const parentCtx = api_1.propagation.extract(api_1.context.active(), msgHeaders, getter);
    const tracer = api_1.trace.getTracer(TRACER_NAME);
    const span = tracer.startSpan(`receive ${subject}`, { kind: api_1.SpanKind.CONSUMER }, parentCtx);
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