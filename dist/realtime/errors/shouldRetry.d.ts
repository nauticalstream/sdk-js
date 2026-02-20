import type { Logger } from 'pino';
/**
 * Determine if an error should trigger a retry
 * Only SystemException (infrastructure errors) are retried
 * DomainException and unknown errors that aren't SystemException are not retried
 */
export declare function shouldRetry(logger: Logger, error: unknown): boolean;
//# sourceMappingURL=shouldRetry.d.ts.map