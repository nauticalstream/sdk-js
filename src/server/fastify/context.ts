import { AsyncLocalStorage } from 'node:async_hooks';
import { peekCorrelationId, generateCorrelationId } from '../../telemetry/utils/context.js';
import type { Context, ActionSource } from './types.js';

const contextStorage = new AsyncLocalStorage<Context>();

// ────────────────────────────────────────────────────────────────────────────
// Context Enrichment (Internal)
// ────────────────────────────────────────────────────────────────────────────

/**
 * Enrich partial context with computed audit fields.
 * @internal
 */
function enrichContext(partial: {
  userId?: string;
  workspaceId?: string;
  source: ActionSource;
  correlationId?: string;
  traceId?: string;
  spanId?: string;
  requestId?: string;
  ip?: string;
  userAgent?: string;
  headers?: Record<string, string | string[] | undefined>;
  eventMetadata?: {
    eventSource: string;
    eventTimestamp: string;
    eventType?: string;
  };
}): Context {
  // Normalize empty strings to undefined (never allow empty strings in context)
  const userId = partial.userId && partial.userId !== '' ? partial.userId : undefined;
  const workspaceId = partial.workspaceId && partial.workspaceId !== '' ? partial.workspaceId : undefined;
  const { source } = partial;
  
  // Compute audit fields once
  const actorId = userId ?? null;
  const actionSource = source;
  const isUserAction = source === 'user' && !!userId;
  const isSystemAction = !userId || source !== 'user';
  
  return {
    // Telemetry
    correlationId: partial.correlationId ?? peekCorrelationId() ?? generateCorrelationId(),
    traceId: partial.traceId,
    spanId: partial.spanId,
    requestId: partial.requestId,
    ip: partial.ip ?? '127.0.0.1',
    userAgent: partial.userAgent,
    headers: partial.headers ?? {},
    
    // Business
    userId,
    workspaceId,
    tenantId: undefined,
    
    // Audit (pre-computed)
    source,
    actorId,
    actionSource,
    isUserAction,
    isSystemAction,
    
    // Event metadata
    eventMetadata: partial.eventMetadata,
  };
}

// ────────────────────────────────────────────────────────────────────────────
// Public Context Builders
// ────────────────────────────────────────────────────────────────────────────

/**
 * Create context for user-initiated actions (GraphQL/HTTP).
 * All audit fields are pre-computed.
 * 
 * @example
 * const ctx = createUserContext({
 *   correlationId: req.headers['x-correlation-id'],
 *   ip: req.ip,
 *   headers: req.headers,
 * }, userId, workspaceId);
 * 
 * // ctx.actorId === userId
 * // ctx.actionSource === 'user'
 * // ctx.isUserAction === true
 */
export function createUserContext(
  request: {
    correlationId?: string;
    traceId?: string;
    spanId?: string;
    requestId?: string;
    ip: string;
    userAgent?: string;
    headers: Record<string, string | string[] | undefined>;
  },
  userId?: string,
  workspaceId?: string
): Context {
  return enrichContext({
    userId,
    workspaceId,
    source: 'user',
    correlationId: request.correlationId,
    traceId: request.traceId,
    spanId: request.spanId,
    requestId: request.requestId,
    ip: request.ip,
    userAgent: request.userAgent,
    headers: request.headers,
  });
}

/**
 * Create context for system-initiated actions (cron, webhooks, internal processes).
 * All audit fields are pre-computed.
 * 
 * @example
 * const ctx = createSystemContext('workspace-123');
 * // ctx.actorId === null
 * // ctx.actionSource === 'system'
 * // ctx.isSystemAction === true
 */
export function createSystemContext(
  workspaceId: string,
  userId?: string
): Context {
  return enrichContext({
    userId,
    workspaceId,
    source: 'system',
  });
}

/**
 * Create context from event envelope with full metadata.
 * All audit fields are pre-computed.
 * 
 * @example
 * const ctx = createContextFromEvent(envelope, data.workspaceId, data.userId);
 * // ctx.actorId === data.userId ?? null
 * // ctx.actionSource === 'system'
 * // ctx.eventMetadata.eventSource === envelope.source (identifies the specific event source)
 */
export function createContextFromEvent(
  envelope: {
    correlationId: string;
    source: string;
    timestamp: string;
    subject?: string;
  },
  workspaceId?: string,
  userId?: string
): Context {
  return enrichContext({
    userId,
    workspaceId,
    source: 'system',
    correlationId: envelope.correlationId,
    eventMetadata: {
      eventSource: envelope.source,
      eventTimestamp: envelope.timestamp,
      eventType: envelope.subject,
    },
  });
}

// ────────────────────────────────────────────────────────────────────────────
// AsyncLocalStorage (for SDK internal use + utilities)
// ────────────────────────────────────────────────────────────────────────────

/**
 * Store context in AsyncLocalStorage and run function.
 * @internal Used by SDK plugins
 */
export async function withContext<T>(
  ctx: Context,
  fn: () => T | Promise<T>
): Promise<T> {
  return contextStorage.run(ctx, fn);
}

/**
 * Get current context from AsyncLocalStorage.
 * 
 * ⚠️  Use sparingly! Prefer explicit ctx parameter in service methods.
 * Only use in low-level utilities/middleware where threading context is impractical.
 * 
 * @example
 * // ✅ Good - utility function
 * export function logMetric(name: string, value: number) {
 *   const ctx = getContext();
 *   metrics.record(name, value, {
 *     workspaceId: ctx?.workspaceId,
 *     userId: ctx?.actorId,
 *   });
 * }
 * 
 * // ❌ Bad - service method (use ctx parameter instead)
 * export class CreateArticle {
 *   async execute(input: Input) {
 *     const ctx = getContext(); // ❌ Don't do this!
 *   }
 * }
 */
export function getContext(): Context | undefined {
  return contextStorage.getStore();
}
