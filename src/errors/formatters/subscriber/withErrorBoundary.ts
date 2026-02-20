import { DomainException } from '../../base/DomainException';
import { SystemException } from '../../base/SystemException';

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
export function withErrorBoundary<T>(
  subject: string,
  handler: (data: T) => Promise<void>,
  logger?: Logger
): (data: T) => Promise<void> {
  const log = logger ?? console;

  return async (data: T) => {
    try {
      await handler(data);
    } catch (error) {
      // Domain exception - check if retryable
      if (error instanceof DomainException) {
        if (error.isRetryable) {
          log.warn(
            {
              subject,
              errorCode: error.errorCode,
              severity: error.severity,
              message: error.message,
            },
            'Retryable domain error in subscriber - will retry'
          );
          throw error; // Let JetStream retry
        } else {
          log.warn(
            {
              subject,
              errorCode: error.errorCode,
              severity: error.severity,
              message: error.message,
              data,
            },
            'Non-retryable domain error in subscriber - discarding message'
          );
          return; // Ack message, don't retry
        }
      }

      // System exception - always retryable
      if (error instanceof SystemException) {
        log.warn(
          {
            subject,
            errorCode: error.errorCode,
            severity: error.severity,
            message: error.message,
          },
          'System error in subscriber - will retry'
        );
        throw error; // Let JetStream retry
      }

      // Unknown error - assume transient, retry
      log.error(
        {
          subject,
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        },
        'Unexpected error in subscriber - will retry'
      );
      throw error;
    }
  };
}
