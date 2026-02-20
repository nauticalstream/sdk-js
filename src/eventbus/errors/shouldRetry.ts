import { SystemException } from '../../errors';
import type { Logger } from 'pino';

/**
 * Determine if an error should trigger a retry for NATS/JetStream operations
 */
export function shouldRetry(logger: Logger, subject: string, error: unknown): boolean {
  if (!(error instanceof SystemException)) {
    if (error instanceof Error) {
      logger.warn(
        { error: error.message, subject, errorType: error.constructor.name },
        'Non-retryable NATS error: giving up without retry'
      );
    }
    return false;
  }

  logger.debug(
    { error: error.message, subject, errorType: error.constructor.name },
    'Retryable NATS error: will retry'
  );
  return true;
}
