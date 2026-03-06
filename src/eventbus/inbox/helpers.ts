/**
 * @nauticalstream/sdk — Inbox Pattern Helpers
 *
 * Low-level helper functions for event idempotency checking.
 * Most users should use `withIdempotentHandler()` instead.
 */

import type { Event } from '../envelope';
import type { PrismaTransaction, ProcessedEventData } from './types';

/**
 * Check if an event has already been processed by this consumer.
 *
 * @param tx - Prisma transaction
 * @param eventId - Event ID (unique per event instance)
 * @param consumerName - Consumer name (e.g., 'article-consumer')
 * @returns true if event was already processed
 *
 * @example
 * ```typescript
 * const alreadyProcessed = await isEventProcessed(tx, event.id, 'article-consumer');
 * if (alreadyProcessed) {
 *   return; // Skip processing
 * }
 * ```
 */
export async function isEventProcessed(
  tx: PrismaTransaction,
  eventId: string,
  consumerName: string
): Promise<boolean> {
  const existing = await tx.processedEvent.findUnique({
    where: {
      eventId_consumerName: {
        eventId,
        consumerName,
      },
    },
  });

  return existing !== null;
}

/**
 * Mark an event as processed to prevent duplicate processing.
 *
 * @param tx - Prisma transaction
 * @param event - Event envelope
 * @param consumerName - Consumer name (e.g., 'article-consumer')
 * @param metadata - Optional JetStream metadata (stream, sequence)
 *
 * @example
 * ```typescript
 * // Core NATS (no metadata)
 * await markEventProcessed(tx, event, 'article-consumer');
 *
 * // JetStream (with metadata)
 * await markEventProcessed(tx, event, 'article-consumer', {
 *   streamName: 'ARTICLES',
 *   sequenceNumber: 12345n
 * });
 * ```
 */
export async function markEventProcessed(
  tx: PrismaTransaction,
  event: Event,
  consumerName: string,
  metadata?: { streamName: string; sequenceNumber: bigint }
): Promise<void> {
  const data: ProcessedEventData = {
    eventId: event.id,
    correlationId: event.correlationId,
    subject: event.subject,
    streamName: metadata?.streamName ?? 'core-nats',
    sequenceNumber: metadata?.sequenceNumber ?? 0n,
    source: event.source,
    consumerName,
    eventTimestamp: new Date(event.timestamp),
    processedAt: new Date(),
  };

  await tx.processedEvent.create({ data });
}
