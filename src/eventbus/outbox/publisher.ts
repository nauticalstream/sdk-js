/**
 * @nauticalstream/sdk — Outbox Publisher
 *
 * Transactional event publishing for reliable message delivery.
 * Used with CDC tools like Sequin to publish to NATS.
 */

import type { Message } from '@bufbuild/protobuf';
import type { PrismaTransaction, EventSchema, EventData } from './types';
import { buildOutboxRecord } from './helpers';

/**
 * Outbox publisher with pre-configured source.
 *
 * @example
 * ```typescript
 * // In DI container
 * container.bind(TYPES.OutboxPublisher).toConstantValue(
 *   new OutboxPublisher('workspace-service')
 * );
 *
 * // In service
 * @injectable()
 * export class CreateWorkspaceService {
 *   constructor(
 *     @inject(TYPES.OutboxPublisher) private outbox: OutboxPublisher,
 *   ) {}
 *
 *   async execute(input: CreateWorkspace) {
 *     return await this.prisma.$transaction(async (tx) => {
 *       const workspace = await tx.workspace.create({ data: { ... } });
 *
 *       await this.outbox.publish(tx, WorkspaceCreatedSchema, {
 *         workspace: WorkspaceMapper.toProto(workspace)
 *       });
 *     });
 *   }
 * }
 * ```
 */
export class OutboxPublisher {
  /**
   * Create a new outbox publisher.
   *
   * @param source - Service name (e.g., 'workspace-service')
   */
  constructor(private readonly source: string) {}

  /**
   * Publish event to outbox within a transaction.
   *
   * @param tx - Prisma transaction
   * @param schema - Protobuf message schema
   * @param data - Message data
   */
  async publish<T extends Message>(
    tx: PrismaTransaction,
    schema: EventSchema<T>,
    data: EventData<T>
  ): Promise<void> {
    const outboxRecord = buildOutboxRecord(this.source, schema, data);
    await tx.outbox.create({ data: outboxRecord });
  }

  /**
   * Alias for backward compatibility.
   * @deprecated Use publish() instead
   */
  async write<T extends Message>(
    tx: PrismaTransaction,
    schema: EventSchema<T>,
    data: EventData<T>
  ): Promise<void> {
    return this.publish(tx, schema, data);
  }

  /**
   * Get the source name for this publisher.
   */
  getSource(): string {
    return this.source;
  }
}
