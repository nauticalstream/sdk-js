import { NetworkError, TimeoutError, ServiceUnavailableError, ValidationError, UnauthorizedError, SystemException, DomainException } from '../../errors';

/**
 * Classify MQTT errors to determine if they should be retried
 * Only infrastructure errors (transient) inherit from SystemException
 * Domain errors (permanent) inherit from DomainException and should not retry
 */
export function classifyMQTTError(error: Error & { code?: number }): Error {
  // Already classified error
  if (error instanceof SystemException || error instanceof DomainException) {
    return error;
  }

  const code = error.code;
  const message = error.message || '';

  // MQTT-specific error codes (RFC 3749)
  // https://docs.oasis-open.org/mqtt/mqtt/v3.1.1/mqtt-v3.1.1.html#_Toc442180779

  // Malformed packet or bad format → ValidationError (don't retry)
  if (code === 132 || code === 138 || message.includes('format') || message.includes('malformed')) {
    return new ValidationError('Malformed MQTT packet - payload validation failed');
  }

  // Authentication/authorization failures → don't retry
  if (
    code === 130 ||
    code === 135 ||
    message.includes('not authorized') ||
    message.includes('unauthorized') ||
    message.includes('auth')
  ) {
    return new UnauthorizedError('MQTT authentication failed - check credentials');
  }

  // Transient failures → ServiceUnavailableError (retry)
  if (
    code === 131 || // Server unavailable
    code === 136 || // Server moving
    code === 137 || // Connection rate limited
    message.includes('ECONNREFUSED') ||
    message.includes('temporarily unavailable') ||
    message.includes('server')
  ) {
    return new ServiceUnavailableError('MQTT broker temporarily unavailable');
  }

  // Timeout → TimeoutError (retry)
  if (message.includes('timeout') || message.includes('ETIMEDOUT') || message.includes('EHOSTUNREACH')) {
    return new TimeoutError(message || 'MQTT operation timeout');
  }

  // Network errors → NetworkError (retry)
  if (
    message.includes('ECONNRESET') ||
    message.includes('ENOTFOUND') ||
    message.includes('socket') ||
    message.includes('DNS')
  ) {
    return new NetworkError(message || 'Network error during MQTT operation');
  }

  // Unknown error → default to retryable (infrastructure errors more common than logic errors in networking)
  return new ServiceUnavailableError('Unknown MQTT error - will retry');
}
