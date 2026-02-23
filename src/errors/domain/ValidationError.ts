import { ErrorCode, ErrorSeverity } from '@nauticalstream/proto/error/v1/codes_pb';
import { DomainException } from '../base/DomainException';

/**
 * ValidationError
 * 
 * Thrown when input data fails validation (schema, business rules, constraints).
 * 
 * - Error Code: 10000 (VALIDATION_ERROR)
 * - HTTP Status: 400
 * - Severity: CLIENT_ERROR (non-retryable)
 * - GraphQL Code: VALIDATION_ERROR
 * 
 * @example
 * ```typescript
 * const result = schema.safeParse(input);
 * if (!result.success) {
 *   const errors = result.error.issues.map(i => i.message).join(', ');
 *   throw new ValidationError(errors);
 * }
 * 
 * if (input.startDate > input.endDate) {
 *   throw new ValidationError('Start date must be before end date');
 * }
 * 
 * // With structured details
 * throw new ValidationError('Invalid user data', [
 *   { field: 'email', message: 'Invalid email format' },
 *   { field: 'age', message: 'Must be at least 18' }
 * ]);
 * ```
 */
export class ValidationError extends DomainException {
  readonly errorCode = ErrorCode.VALIDATION_ERROR;
  readonly severity = ErrorSeverity.CLIENT_ERROR;
  readonly httpStatus = 400;
  readonly graphqlCode = 'VALIDATION_ERROR';

  /**
   * Structured validation errors (optional)
   * Useful for form validation with field-specific errors
   */
  public readonly details?: Array<{
    path?: string;
    field?: string;
    message: string;
    code?: string;
  }>;

  constructor(message: string, details?: Array<{ path?: string; field?: string; message: string; code?: string }>) {
    super(message);
    this.details = details;
  }
}
