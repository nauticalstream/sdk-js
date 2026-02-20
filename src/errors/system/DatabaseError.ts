import { ErrorCode } from '@nauticalstream/proto/error/v1/codes_pb';
import { SystemException } from '../base/SystemException';

/**
 * DatabaseError
 * 
 * Thrown when database operations fail (connection, query, transaction).
 * 
 * - Error Code: 50000 (INTERNAL_ERROR)
 * - HTTP Status: 500
 * - Severity: RETRYABLE (may succeed on retry)
 * - GraphQL Code: INTERNAL_SERVER_ERROR
 * 
 * Database errors are retryable because they often represent transient failures:
 * - Connection pool exhausted
 * - Lock timeouts
 * - Temporary network issues
 * - Replica lag
 * 
 * @example
 * ```typescript
 * try {
 *   await db.query('SELECT * FROM users');
 * } catch (err) {
 *   throw new DatabaseError('Failed to query users', err.message);
 * }
 * ```
 */
export class DatabaseError extends SystemException {
  readonly errorCode = ErrorCode.INTERNAL_ERROR;

  constructor(
    message: string,
    public readonly originalError?: unknown
  ) {
    super(message);
  }

  toJSON() {
    return {
      ...super.toJSON(),
      originalError: this.originalError instanceof Error 
        ? this.originalError.message 
        : String(this.originalError),
    };
  }
}
