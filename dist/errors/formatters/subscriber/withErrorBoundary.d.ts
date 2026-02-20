/**
 * Logger interface (compatible with Pino, Winston, console)
 */
interface Logger {
    warn(obj: unknown, msg?: string): void;
    error(obj: unknown, msg?: string): void;
}
/**
 * Wrap JetStream/NATS subscriber handler with automatic error boundary
 *
 * Handles retry/discard logic based on exception severity:
 * - Domain exceptions (CLIENT_ERROR, FATAL) → ack message (don't retry)
 * - System exceptions (RETRYABLE) → throw to retry
 * - Unknown errors → throw to retry (assume transient)
 *
 * @param subject - NATS subject name (for logging)
 * @param handler - Subscriber handler function
 * @param logger - Optional logger (defaults to console)
 *
 * @example
 * ```typescript
 * import { withErrorBoundary } from '@nauticalstream/errors';
 *
 * eventbus.subscribe({
 *   subject: 'message.created',
 *   handler: withErrorBoundary('MESSAGE_CREATED', async (data) => {
 *     // NotFoundError → discards message (CLIENT_ERROR, non-retryable)
 *     // DatabaseError → retries message (RETRYABLE)
 *     await processMessage(data);
 *   }),
 * });
 * ```
 */
export declare function withErrorBoundary<T>(subject: string, handler: (data: T) => Promise<void>, logger?: Logger): (data: T) => Promise<void>;
export {};
//# sourceMappingURL=withErrorBoundary.d.ts.map