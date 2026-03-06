/**
 * @nauticalstream/sdk — Transactional Outbox Pattern
 *
 * Reliable event publishing with transactional guarantees.
 *
 * @example Class API (recommended for DI)
 * ```typescript
 * import { OutboxPublisher } from '@nauticalstream/sdk/eventbus';
 *
 * // In DI container
 * container.bind(TYPES.OutboxPublisher).toConstantValue(
 *   new OutboxPublisher('workspace-service')
 * );
 *
 * // In service
 * @injectable()
 * class CreateWorkspaceService {
 *   constructor(
 *     @inject(TYPES.OutboxPublisher) private outbox: OutboxPublisher
 *   ) {}
 *
 *   async execute(input: CreateWorkspace) {
 *     await prisma.$transaction(async (tx) => {
 *       const workspace = await tx.workspace.create({ data: { ... } });
 *       await this.outbox.publish(tx, WorkspaceCreatedSchema, { workspace });
 *     });
 *   }
 * }
 * ```
 *
 * @example Low-level helpers
 * ```typescript
 * import { buildOutboxRecord } from '@nauticalstream/sdk/eventbus';
 *
 * await prisma.$transaction(async (tx) => {
 *   const workspace = await tx.workspace.create({ data: { ... } });
 *   const record = buildOutboxRecord('workspace-service', WorkspaceCreatedSchema, { workspace });
 *   await tx.outbox.create({ data: record });
 * });
 * ```
 */

// ── Main API ─────────────────────────────────────────────────────────────────
export { OutboxPublisher } from './publisher';

// ── Low-level helpers ────────────────────────────────────────────────────────
export { buildOutboxRecord } from './helpers';

// ── Types ────────────────────────────────────────────────────────────────────
export type {
  OutboxRecord,
  PrismaTransaction,
  EventSchema,
  EventData,
} from './types';
