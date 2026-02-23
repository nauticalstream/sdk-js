import { toJson, toJsonString, fromJsonString, create } from '@bufbuild/protobuf';
import type { Message, MessageInitShape, JsonObject } from '@bufbuild/protobuf';
import type { GenMessage } from '@bufbuild/protobuf/codegenv2';
import { EventSchema, type Event } from '@nauticalstream/proto/platform/v1/event_pb';
import { createPublishHeaders } from './observability/tracing';
import { peekCorrelationId, generateCorrelationId } from '../telemetry/utils/context';
import { deriveSubject } from './utils/derive-subject';
import type { MsgHdrs } from 'nats';

export type { Event };

/** Result of buildEnvelope — the proto Event, its JSON string payload, and OTel NATS headers. */
export interface Envelope {
  event: Event;
  payload: string;
  headers: MsgHdrs;
}

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
 * `subject` is optional — if omitted it is auto-derived from `schema.typeName`
 * via `deriveSubject` (e.g. 'workspace.v1.WorkspaceCreated' → 'workspace.v1.workspace-created').
 * Pass an explicit subject only for request/reply or other cases where the
 * routing key differs from the message type name.
 *
 * Wire format: toJsonString(EventSchema, event) → UTF-8 bytes
 */
export function buildEnvelope<T extends Message>(
  source: string,
  schema: GenMessage<T>,
  data: MessageInitShape<GenMessage<T>>,
  options?: { subject?: string; correlationId?: string }
): Envelope;
/** @deprecated Pass options object instead of positional subject/correlationId */
export function buildEnvelope<T extends Message>(
  source: string,
  subject: string,
  schema: GenMessage<T>,
  data: MessageInitShape<GenMessage<T>>,
  correlationId?: string
): Envelope;
export function buildEnvelope<T extends Message>(
  source: string,
  schemaOrSubject: GenMessage<T> | string,
  dataOrSchema: MessageInitShape<GenMessage<T>> | GenMessage<T>,
  optionsOrData?: { subject?: string; correlationId?: string } | MessageInitShape<GenMessage<T>>,
  legacyCorrelationId?: string
): Envelope {
  // Overload resolution
  let subject: string;
  let schema: GenMessage<T>;
  let data: MessageInitShape<GenMessage<T>>;
  let correlationId: string | undefined;

  if (typeof schemaOrSubject === 'string') {
    // Legacy positional: (source, subject, schema, data, correlationId?)
    subject = schemaOrSubject;
    schema = dataOrSchema as GenMessage<T>;
    data = optionsOrData as MessageInitShape<GenMessage<T>>;
    correlationId = legacyCorrelationId;
  } else {
    // New: (source, schema, data, options?)
    schema = schemaOrSubject;
    data = dataOrSchema as MessageInitShape<GenMessage<T>>;
    const opts = optionsOrData as { subject?: string; correlationId?: string } | undefined;
    subject = opts?.subject ?? deriveSubject(schema.typeName);
    correlationId = opts?.correlationId;
  }
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
    payload: toJsonString(EventSchema, event),
    headers: createPublishHeaders(resolvedCorrelationId),
  };
}

/** Decode a NATS message into a platform.v1.Event. Accepts both raw bytes and JSON strings. */
export function parseEnvelope(raw: Uint8Array | string): Event {
  const json = typeof raw === 'string' ? raw : decoder.decode(raw);
  return fromJsonString(EventSchema, json);
}
