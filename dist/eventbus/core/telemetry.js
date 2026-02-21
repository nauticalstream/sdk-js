import { context, propagation, trace, SpanKind, SpanStatusCode, } from '@opentelemetry/api';
import { headers as natsHeaders } from 'nats';
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
export function createPublishHeaders(correlationId) {
    const h = natsHeaders();
    h.set('x-correlation-id', correlationId);
    propagation.inject(context.active(), h, setter);
    return h;
}
/**
 * Wrap a subscribe handler in an OTel child span.
 * Extracts trace context from inbound NATS headers (propagated from the publisher).
 * Records exceptions and sets error status on failure.
 * If no OTel SDK is registered all calls are silent no-ops.
 */
export async function withSubscribeSpan(subject, msgHeaders, fn) {
    const parentCtx = propagation.extract(context.active(), msgHeaders, getter);
    const tracer = trace.getTracer(TRACER_NAME);
    const span = tracer.startSpan(`receive ${subject}`, { kind: SpanKind.CONSUMER }, parentCtx);
    return context.with(trace.setSpan(parentCtx, span), async () => {
        try {
            await fn();
            span.setStatus({ code: SpanStatusCode.OK });
        }
        catch (err) {
            span.setStatus({ code: SpanStatusCode.ERROR });
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