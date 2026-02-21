import { SystemException } from '../../errors';
/**
 * Determine if an error should trigger a retry for NATS/JetStream operations
 */
export function shouldRetry(logger, subject, error) {
    if (!(error instanceof SystemException)) {
        if (error instanceof Error) {
            logger.warn({ error: error.message, subject, errorType: error.constructor.name }, 'Non-retryable NATS error: giving up without retry');
        }
        return false;
    }
    logger.debug({ error: error.message, subject, errorType: error.constructor.name }, 'Retryable NATS error: will retry');
    return true;
}
//# sourceMappingURL=shouldRetry.js.map