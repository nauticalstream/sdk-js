import { ErrorCode, ErrorSeverity } from '@nauticalstream/proto/error/v1/codes_pb';
import { DomainException } from '../base/DomainException';

/**
 * OperationError
 * 
 * Thrown when a business operation fails due to logic/state issues.
 * Different from ValidationError - operation is valid but cannot be completed.
 * 
 * - Error Code: 50000 (INTERNAL_ERROR)
 * - HTTP Status: 500
 * - Severity: FATAL (non-retryable, permanent failure)
 * - GraphQL Code: OPERATION_ERROR
 * 
 * @example
 * ```typescript
 * if (!canDeleteConversation(conversation)) {
 *   throw new OperationError('Cannot delete conversation with active messages');
 * }
 * 
 * if (payment.status === 'completed') {
 *   throw new OperationError('Cannot refund a completed payment');
 * }
 * ```
 */
export class OperationError extends DomainException {
  readonly errorCode = ErrorCode.INTERNAL_ERROR;
  readonly severity = ErrorSeverity.FATAL;
  readonly httpStatus = 500;
  readonly graphqlCode = 'OPERATION_ERROR';

  constructor(message: string = 'Operation failed') {
    super(message);
  }
}
