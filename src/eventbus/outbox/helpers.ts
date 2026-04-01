/**
 * @nauticalstream/sdk — Outbox Pattern Helpers
 *
 * Low-level helper functions for building outbox records.
 */

import { toJson } from '@bufbuild/protobuf';
import type { Message } from '@bufbuild/protobuf';
import { EventSchema } from '@nauticalstream/proto/platform/v1/event_pb';
import { buildEnvelope } from '../envelope.js';
import type { OutboxRecord, EventSchema as SchemaType, EventData } from './types.js';

/**
 * Build an outbox record from event schema and data.
 *
 * Creates Event envelope and serializes to JSON for database storage.
 *
 * @param source - Service name (e.g., 'workspace-service')
 * @param schema - Protobuf message schema
 * @param data - Message data
 * @returns Outbox record ready for database insertion
 */
export function buildOutboxRecord<T extends Message>(
  source: string,
  schema: SchemaType<T>,
  data: EventData<T>
): OutboxRecord {
  const { event } = buildEnvelope(source, schema, data);
  const payload = toJson(EventSchema, event);

  return {
    id: event.id,                      // Unique event ID
    correlationId: event.correlationId, // For tracing
    subject: event.subject,
    payload: payload as any,
  };
}
