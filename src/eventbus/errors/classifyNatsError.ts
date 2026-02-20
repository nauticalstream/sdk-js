import { SystemException, DomainException, TimeoutError, NetworkError, ValidationError, UnauthorizedError, ServiceUnavailableError } from '../../errors';

/**
 * Classify NATS/JetStream errors to determine if they should be retried
 */
export function classifyNatsError(error: unknown): Error {
  if (error instanceof SystemException || error instanceof DomainException) {
    return error;
  }

  if (!(error instanceof Error)) {
    return new ServiceUnavailableError('Unknown NATS error');
  }

  const message = error.message || '';

  // Connection errors → retryable
  if (
    message.includes('disconnected') ||
    message.includes('lost connection') ||
    message.includes('ECONNREFUSED') ||
    message.includes('connection refused')
  ) {
    return new NetworkError(message || 'NATS connection lost');
  }

  // Timeout errors → retryable
  if (message.includes('timeout') || message.includes('ETIMEDOUT')) {
    return new TimeoutError(message || 'NATS operation timeout');
  }

  // Invalid subject or format → not retryable (application bug)
  if (message.includes('invalid subject') || message.includes('bad subject')) {
    return new ValidationError('Invalid NATS subject - check application logic');
  }

  // Auth errors → not retryable
  if (message.includes('authorization') || message.includes('unauthorized')) {
    return new UnauthorizedError('NATS authorization failed - check credentials');
  }

  // Unknown → default to retryable (connection errors more common than logic errors)
  return new ServiceUnavailableError(`NATS error: ${message}`);
}
