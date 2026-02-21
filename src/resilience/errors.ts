/**
 * Error handling utilities for resilience patterns
 */

import { SystemException } from '../errors';

/**
 * Determines if an error should trigger a retry
 * Retries SystemException (infrastructure errors), skips DomainException (client errors)
 */
export function shouldRetry(error: Error): boolean {
  return error instanceof SystemException;
}
