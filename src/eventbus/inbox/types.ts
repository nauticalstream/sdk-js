/**
 * @nauticalstream/sdk — Inbox Pattern Types
 *
 * Types for idempotent event consumption (Transactional Inbox Pattern).
 */

/**
 * Data required to create a processed event record.
 * Maps from Event envelope to database fields.
 */
export interface ProcessedEventData {
  id: string;               // event.id - unique per event (composite PK with consumerName)
  correlationId: string;    // event.correlationId - for tracing
  subject: string;          // NATS subject that identifies the event
  streamName: string;       // From JetStream metadata (or 'core-nats' for ephemeral)
  sequenceNumber: bigint;   // From JetStream metadata (or 0n for ephemeral)
  source: string;
  consumerName: string;
  eventTimestamp: Date;
  processedAt: Date;
}

/**
 * Optional JetStream metadata for enhanced event tracking.
 * Only available when consuming from JetStream, not Core NATS.
 */
export interface JetStreamMetadata {
  streamName: string;
  sequenceNumber: bigint;
}

/**
 * Options for idempotent handler.
 */
export interface IdempotentHandlerOptions {
  /**
   * JetStream metadata (stream name, sequence number).
   * Optional - only available when consuming from JetStream.
   */
  metadata?: JetStreamMetadata;

  /**
   * Skip creating processedEvent record (useful for testing).
   * @default false
   */
  skipMarkProcessed?: boolean;

  /**
   * Custom logger for inbox operations.
   */
  logger?: {
    info: (message: string, meta?: Record<string, unknown>) => void;
    warn: (message: string, meta?: Record<string, unknown>) => void;
    error: (message: string, meta?: Record<string, unknown>) => void;
  };
}

/**
 * Generic Prisma transaction type.
 * Supports any Prisma client transaction.
 */
export type PrismaTransaction = {
  processedEvent: {
    findUnique: (args: {
      where: { id_consumerName: { id: string; consumerName: string } };
    }) => Promise<{ id: string; consumerName: string } | null>;
    create: (args: { data: ProcessedEventData }) => Promise<unknown>;
  };
};

/**
 * Generic Prisma client type with $transaction support.
 */
export type PrismaClient = {
  $transaction: <T>(
    fn: (tx: PrismaTransaction) => Promise<T>,
    options?: { timeout?: number; maxWait?: number; isolationLevel?: string }
  ) => Promise<T>;
};
