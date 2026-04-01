/**
 * @nauticalstream/sdk — Event Processor Class
 *
 * Class-based API for idempotent event processing.
 * Useful for services with many event handlers.
 */

import type { Event } from '../envelope.js';
import type { PrismaClient, PrismaTransaction, IdempotentHandlerOptions } from './types.js';
import { withIdempotentHandler } from './transaction.js';

/**
 * Event processor with pre-configured consumer name.
 *
 * Provides class-based API for services that prefer OOP style
 * or have many event handlers (reduces boilerplate).
 *
 * @example
 * ```typescript
 * import { EventProcessor } from '@nauticalstream/sdk/eventbus/inbox';
 *
 * export class ArticleEventHandlers {
 *   private processor = new EventProcessor(prisma, 'article-consumer');
 *
 *   async handleCreated(event: Event, data: ArticleCreated) {
 *     await this.processor.process(event, async (tx) => {
 *       const article = await tx.article.create({ data: { ... } });
 *       await tx.articleAuthor.create({ data: { ... } });
 *     });
 *   }
 *
 *   async handleUpdated(event: Event, data: ArticleUpdated) {
 *     await this.processor.process(event, async (tx) => {
 *       await tx.article.update({ where: { id: data.id }, data: { ... } });
 *     });
 *   }
 *
 *   async handleDeleted(event: Event, data: ArticleDeleted) {
 *     await this.processor.process(event, async (tx) => {
 *       await tx.article.delete({ where: { id: data.id } });
 *     });
 *   }
 * }
 * ```
 */
export class EventProcessor {
  /**
   * Create a new event processor.
   *
   * @param prisma - Prisma client instance
   * @param consumerName - Unique consumer identifier (e.g., 'article-consumer')
   * @param options - Default options for all process() calls
   */
  constructor(
    private readonly prisma: PrismaClient,
    private readonly consumerName: string,
    private readonly defaultOptions: IdempotentHandlerOptions = {}
  ) {}

  /**
   * Process event with automatic idempotency.
   *
   * @param event - Event envelope from NATS
   * @param handler - Business logic to execute
   * @param options - Optional configuration (overrides defaults)
   * @returns Handler result or null if already processed
   */
  async process<T>(
    event: Event,
    handler: (tx: PrismaTransaction) => Promise<T>,
    options?: IdempotentHandlerOptions
  ): Promise<T | null> {
    const mergedOptions = { ...this.defaultOptions, ...options };
    return withIdempotentHandler(this.prisma, event, this.consumerName, handler, mergedOptions);
  }

  /**
   * Get the consumer name for this processor.
   */
  getConsumerName(): string {
    return this.consumerName;
  }
}
