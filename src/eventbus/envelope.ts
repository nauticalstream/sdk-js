import { toJson, toJsonString, fromJsonString, create } from '@bufbuild/protobuf';
import type { Message, MessageInitShape, JsonObject } from '@bufbuild/protobuf';
import type { GenMessage } from '@bufbuild/protobuf/codegenv2';
import { EventSchema, type Event } from '@nauticalstream/proto/platform/v1/event_pb';
import { createPublishHeaders } from './observability/tracing';
import { peekCorrelationId, generateCorrelationId } from '../telemetry/utils/context';
import type { MsgHdrs } from 'nats';

export type { Event };

/** Result of buildEnvelope — the proto Event, its wire bytes, and OTel NATS headers. */
export interface Envelope {
  event: Event;
  binary: Uint8Array;
  headers: MsgHdrs;
}

const encoder = new TextEncoder();
const decoder = new TextDecoder();

/**
 * Wrap any proto message in a platform.v1.Event and encode it for the wire.
 *
 * - type          = NATS subject (doubles as the event type discriminator)
 * - source        = publishing service name
 * - correlationId = caller-supplied or propagated from async context
 * - timestamp     = UTC ISO-8601 at call time
 * - data          = toJson(schema, data) — human-readable, schema-validated JSON
 *
 * Wire format: toJsonString(EventSchema, event) → UTF-8 bytes
 */
export function buildEnvelope<T extends Message>(
  source: string,
  subject: string,
  schema: GenMessage<T>,
  data: MessageInitShape<GenMessage<T>>,
  correlationId?: string
): Envelope {
  const resolvedCorrelationId = correlationId ?? peekCorrelationId() ?? generateCorrelationId();
  const message = create(schema, data);
  const event = create(EventSchema, {
    type: subject,
    source,
    correlationId: resolvedCorrelationId,
    timestamp: new Date().toISOString(),
    data: toJson(schema, message) as JsonObject,
  });

  return {
    event,
    binary: encoder.encode(toJsonString(EventSchema, event)),
    headers: createPublishHeaders(resolvedCorrelationId),
  };
}

/** Decode raw NATS message bytes into a platform.v1.Event. */
export function parseEnvelope(raw: Uint8Array): Event {
  return fromJsonString(EventSchema, decoder.decode(raw));
}
