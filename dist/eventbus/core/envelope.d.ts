import type { Message } from '@bufbuild/protobuf';
import type { GenMessage } from '@bufbuild/protobuf/codegenv2';
import { type Event } from '@nauticalstream/proto/platform/v1/event_pb';
import type { MsgHdrs } from 'nats';
export type { Event };
export interface Envelope {
    event: Event;
    binary: Uint8Array;
    headers: MsgHdrs;
}
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
export declare function buildEnvelope<T extends Message>(source: string, subject: string, schema: GenMessage<T>, data: T, correlationId?: string): Envelope;
/**
 * Parse raw NATS message bytes into a platform.v1.Event.
 */
export declare function parseEnvelope(raw: Uint8Array): Event;
//# sourceMappingURL=envelope.d.ts.map