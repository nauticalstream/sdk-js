/**
 * @nauticalstream/sdk — Outbox Pattern Types
 *
 * Types for transactional event publishing (Transactional Outbox Pattern).
 */

import type { Message, MessageInitShape, JsonObject } from '@bufbuild/protobuf';
import type { GenMessage } from '@bufbuild/protobuf/codegenv2';

/**
 * Data required to create an outbox record.
 */
export interface OutboxRecord {
  id: string;              // Event ID (unique per event)
  correlationId: string;   // Correlation ID (for tracing)
  subject: string;         // NATS subject
  payload: JsonObject;     // Serialized Event envelope
}

/**
 * Generic Prisma transaction type for outbox operations.
 * Supports any Prisma client transaction with outbox table.
 */
export type PrismaTransaction = {
  outbox: {
    create: (args: { data: OutboxRecord }) => Promise<unknown>;
  };
};

/**
 * Type helper for protobuf message schemas.
 */
export type EventSchema<T extends Message = Message> = GenMessage<T>;

/**
 * Type helper for protobuf message data.
 */
export type EventData<T extends Message = Message> = MessageInitShape<GenMessage<T>>;
