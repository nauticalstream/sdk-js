import { type MsgHdrs } from 'nats';
/**
 * Create NATS headers with OTel trace context injected.
 * Also carries the correlationId as a header for log correlation.
 * If no OTel SDK is registered this is a silent no-op and empty headers are returned.
 */
export declare function createPublishHeaders(correlationId: string): MsgHdrs;
/**
 * Wrap a subscribe handler in an OTel child span.
 * Extracts trace context from inbound NATS headers (propagated from the publisher).
 * Records exceptions and sets error status on failure.
 * If no OTel SDK is registered all calls are silent no-ops.
 */
export declare function withSubscribeSpan(subject: string, msgHeaders: MsgHdrs | undefined, fn: () => Promise<void>): Promise<void>;
//# sourceMappingURL=telemetry.d.ts.map