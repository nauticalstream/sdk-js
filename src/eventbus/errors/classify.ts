import {
  SystemException,
  DomainException,
  TimeoutError,
  NetworkError,
  ValidationError,
  UnauthorizedError,
  ServiceUnavailableError,
} from '../../errors';

/**
 * Map a raw NATS/JetStream error to a typed SDK error.
 *
 * - Already-typed SDK errors are returned as-is (pass-through).
 * - Connection / disconnect  → NetworkError        (retryable)
 * - Timeout                  → TimeoutError        (retryable)
 * - Invalid subject          → ValidationError     (not retryable)
 * - Authorization failure    → UnauthorizedError   (not retryable)
 * - Everything else          → ServiceUnavailableError (retryable by default)
 */
export function classifyNatsError(error: unknown): Error {
  if (error instanceof SystemException || error instanceof DomainException) return error;
  if (!(error instanceof Error)) return new ServiceUnavailableError('Unknown NATS error');

  const msg = error.message ?? '';

  if (msg.includes('disconnected') || msg.includes('lost connection') ||
      msg.includes('ECONNREFUSED') || msg.includes('connection refused')) {
    return new NetworkError(msg || 'NATS connection lost');
  }

  if (msg.includes('timeout') || msg.includes('ETIMEDOUT')) {
    return new TimeoutError(msg || 'NATS operation timed out');
  }

  if (msg.includes('invalid subject') || msg.includes('bad subject')) {
    return new ValidationError('Invalid NATS subject — check application logic');
  }

  if (msg.includes('authorization') || msg.includes('unauthorized')) {
    return new UnauthorizedError('NATS authorization failed — check credentials');
  }

  return new ServiceUnavailableError(`NATS error: ${msg}`);
}
