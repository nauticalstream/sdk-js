import { ErrorCode } from '@nauticalstream/proto/error/v1/codes_pb';
import { SystemException } from '../base/SystemException';

/**
 * ServiceUnavailableError
 * 
 * Thrown when a required service or dependency is unavailable.
 * 
 * - Error Code: 50001 (SERVICE_UNAVAILABLE)
 * - HTTP Status: 503
 * - Severity: RETRYABLE (service may come back online)
 * - GraphQL Code: INTERNAL_SERVER_ERROR
 * 
 * Used for:
 * - External API down (payment provider, email service, etc.)
 * - Internal microservice unavailable
 * - Third-party service timeout
 * 
 * @example
 * ```typescript
 * try {
 *   await paymentService.charge(amount);
 * } catch (err) {
 *   throw new ServiceUnavailableError('Payment service unavailable');
 * }
 * ```
 */
export class ServiceUnavailableError extends SystemException {
  readonly errorCode = ErrorCode.SERVICE_UNAVAILABLE;
  readonly httpStatus = 503;

  constructor(
    message: string,
    public readonly serviceName?: string
  ) {
    super(message);
  }

  toJSON() {
    return {
      ...super.toJSON(),
      serviceName: this.serviceName,
    };
  }
}
