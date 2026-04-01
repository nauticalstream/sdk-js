/**
 * @nauticalstream/sdk — Transactional Inbox Pattern
 *
 * Industry-standard pattern for idempotent event consumption.
 * Used by Netflix, Uber, Amazon, Shopify, Stripe, LinkedIn.
 *
 * Ensures exactly-once processing semantics:
 * 1. Check if event already processed
 * 2. Execute business logic
 * 3. Mark event as processed
 *
 * All steps happen in a single atomic database transaction.
 */

import type { Event } from '../envelope.js';
import type { PrismaClient, PrismaTransaction, IdempotentHandlerOptions } from './types.js';
import { isEventProcessed, markEventProcessed } from './helpers.js';

/**
 * Execute event handler with automatic idempotency guarantees.
 *
 * Wraps your business logic in a transaction that:
 * - Checks if event was already processed (deduplication)
 * - Executes your handler function
 * - Marks event as processed (prevents future duplicates)
 *
 * If event was already processed, returns `null` without executing handler.
 * If handler throws an error, transaction is rolled back and event is NOT marked as processed.
 *
 * @param prisma - Prisma client instance
 * @param event - Event envelope from NATS
 * @param consumerName - Unique consumer identifier (e.g., 'article-consumer')
 * @param handler - Business logic to execute (receives Prisma transaction)
 * @param options - Optional configuration
 * @returns Handler result or null if already processed
 *
 * @example
 * ```typescript
 * import { withIdempotentHandler } from '@nauticalstream/sdk/eventbus/inbox';
 *
 * export async function handleArticleCreated(event: Event, data: ArticleCreated) {
 *   await withIdempotentHandler(prisma, event, 'article-consumer', async (tx) => {
 *     // Your business logic here - runs exactly once
 *     const article = await tx.article.create({
 *       data: {
 *         id: data.articleId,
 *         title: data.title,
 *         content: data.content,
 *       }
 *     });
 *
 *     await tx.articleAuthor.create({
 *       data: {
 *         articleId: article.id,
 *         userId: data.authorId,
 *       }
 *     });
 *   });
 * }
 * ```
 *
 * @example With error handling
 * ```typescript
 * const result = await withIdempotentHandler(
 *   prisma,
 *   event,
 *   'payment-consumer',
 *   async (tx) => {
 *     await tx.payment.create({ data: paymentData });
 *     return { paymentId: paymentData.id };
 *   }
 * );
 *
 * if (result === null) {
 *   logger.info('Payment already processed', { correlationId: event.correlationId });
 * } else {
 *   logger.info('Payment processed', { paymentId: result.paymentId });
 * }
 * ```
 */
export async function withIdempotentHandler<T>(
  prisma: PrismaClient,
  event: Event,
  consumerName: string,
  handler: (tx: PrismaTransaction) => Promise<T>,
  options: IdempotentHandlerOptions = {}
): Promise<T | null> {
  const { skipMarkProcessed = false, metadata, logger } = options;

  return prisma.$transaction(async (tx: PrismaTransaction) => {
    // Step 1: Check if already processed (idempotency check by eventId)
    const alreadyProcessed = await isEventProcessed(tx, event.id, consumerName);

    if (alreadyProcessed) {
      logger?.info('Event already processed, skipping', {
        eventId: event.id,
        correlationId: event.correlationId,
        consumerName,
        subject: event.subject,
      });
      return null;
    }

    // Step 2: Execute business logic
    logger?.info('Processing event', {
      eventId: event.id,
      correlationId: event.correlationId,
      consumerName,
      subject: event.subject,
      source: event.source,
    });

    const result = await handler(tx);

    // Step 3: Mark as processed (deduplication for future)
    if (!skipMarkProcessed) {
      await markEventProcessed(tx, event, consumerName, metadata);
      logger?.info('Event marked as processed', {
        eventId: event.id,
        correlationId: event.correlationId,
        consumerName,
      });
    }

    return result;
  });
}
