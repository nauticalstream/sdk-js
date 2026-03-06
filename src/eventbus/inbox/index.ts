/**
 * @nauticalstream/sdk — Transactional Inbox Pattern
 *
 * Idempotent event consumption for exactly-once processing semantics.
 *
 * @example Functional API (simple services)
 * ```typescript
 * import { withIdempotentHandler } from '@nauticalstream/sdk/eventbus/inbox';
 *
 * export async function handlePostLiked(event: Event, data: PostLiked) {
 *   await withIdempotentHandler(prisma, event, 'like-consumer', async (tx) => {
 *     await tx.like.create({ data: { ... } });
 *   });
 * }
 * ```
 *
 * @example Class API (complex services with many handlers)
 * ```typescript
 * import { EventProcessor } from '@nauticalstream/sdk/eventbus/inbox';
 *
 * class ArticleHandlers {
 *   private processor = new EventProcessor(prisma, 'article-consumer');
 *
 *   async handleCreated(event: Event, data: ArticleCreated) {
 *     await this.processor.process(event, async (tx) => {
 *       await tx.article.create({ ... });
 *     });
 *   }
 * }
 * ```
 *
 * @example Low-level helpers
 * ```typescript
 * import { isEventProcessed, markEventProcessed } from '@nauticalstream/sdk/eventbus/inbox';
 *
 * await prisma.$transaction(async (tx) => {
 *   if (await isEventProcessed(tx, event.correlationId, 'consumer')) {
 *     return;
 *   }
 *   // Business logic
 *   await markEventProcessed(tx, event, 'consumer');
 * });
 * ```
 */

// ── Main APIs ────────────────────────────────────────────────────────────────
export { withIdempotentHandler } from './transaction';
export { EventProcessor } from './processor';

// ── Low-level helpers ────────────────────────────────────────────────────────
export { isEventProcessed, markEventProcessed } from './helpers';

// ── Types ────────────────────────────────────────────────────────────────────
export type {
  ProcessedEventData,
  JetStreamMetadata,
  IdempotentHandlerOptions,
  PrismaTransaction,
  PrismaClient,
} from './types';
