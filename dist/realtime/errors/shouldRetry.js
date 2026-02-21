import { SystemException } from '../../errors';
/**
 * Determine if an error should trigger a retry
 * Only SystemException (infrastructure errors) are retried
 * DomainException and unknown errors that aren't SystemException are not retried
 */
export function shouldRetry(logger, error) {
    // Non-SystemException errors should not be retried
    if (!(error instanceof SystemException)) {
        if (error instanceof Error) {
            logger.warn({ error: error.message, errorType: error.constructor.name }, 'Non-retryable error: giving up without retry');
        }
        return false;
    }
    // SystemException errors should be retried
    logger.debug({ error: error.message, errorType: error.constructor.name }, 'Retryable infrastructure error: will retry');
    return true;
}
//# sourceMappingURL=shouldRetry.js.map