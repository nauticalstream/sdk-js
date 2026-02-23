import {
  SystemException,
  DomainException,
  NetworkError,
  TimeoutError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
  ServiceUnavailableError,
} from '../../errors';

/**
 * Classify Keto/HTTP errors to determine retry behavior and error type
 * 
 * Retryable (SystemException):
 *   - 429 Rate Limit
 *   - 500, 502, 503, 504 Server Errors
 *   - Network errors (ECONNREFUSED, ETIMEDOUT)
 * 
 * Not Retryable (DomainException):
 *   - 401 Unauthorized
 *   - 403 Forbidden (permission denied)
 *   - 404 Not Found
 *   - 400 Bad Request (validation)
 */
export function classifyKetoError(error: unknown): Error {
  // Already classified errors pass through
  if (error instanceof SystemException || error instanceof DomainException) {
    return error;
  }

  // Handle non-Error objects
  if (!(error instanceof Error)) {
    return new ServiceUnavailableError('Unknown Keto error');
  }

  const message = error.message || '';

  // Network/connection errors → retryable
  if (
    message.includes('ECONNREFUSED') ||
    message.includes('ENOTFOUND') ||
    message.includes('EHOSTUNREACH') ||
    message.includes('connection refused') ||
    message.includes('network error')
  ) {
    return new NetworkError(message || 'Keto connection failed');
  }

  // Timeout errors → retryable
  if (
    message.includes('ETIMEDOUT') ||
    message.includes('timeout') ||
    message.includes('timed out')
  ) {
    return new TimeoutError(message || 'Keto request timeout');
  }

  // HTTP status code extraction — only match explicit HTTP-range codes (4xx/5xx).
  // The bare /(\d{3})/ fallback is intentionally removed: it is too greedy and
  // would misfire on messages like "took 500ms" or "100 items remaining".
  const statusMatch = message.match(/status[:\s]+(\d{3})/i) ||
                      message.match(/code[:\s]+(\d{3})/i) ||
                      message.match(/\b(4\d{2}|5\d{2})\b/);
  const statusCode = statusMatch ? parseInt(statusMatch[1], 10) : null;

  if (statusCode) {
    switch (statusCode) {
      // 4xx Client Errors (non-retryable)
      case 400:
        return new ValidationError('Invalid Keto request - check parameters');
      
      case 401:
        return new UnauthorizedError('Keto authentication failed');
      
      case 403:
        return new ForbiddenError('Keto access denied - check permissions');
      
      case 404:
        return new NotFoundError('Keto resource', 'Relationship or namespace not found');
      
      // 429 Rate Limit (retryable)
      case 429:
        return new ServiceUnavailableError('Keto rate limit exceeded', 'keto');
      
      // 5xx Server Errors (retryable)
      case 500:
      case 502:
      case 503:
      case 504:
        return new ServiceUnavailableError(
          `Keto server error (${statusCode})`,
          'keto'
        );
      
      default:
        // Unknown status → default to retryable
        if (statusCode >= 500) {
          return new ServiceUnavailableError(`Keto error (${statusCode})`, 'keto');
        }
        // 4xx but not handled above → validation error
        if (statusCode >= 400) {
          return new ValidationError(`Keto client error (${statusCode})`);
        }
    }
  }

  // Unknown error → default to retryable (service availability issue more common)
  return new ServiceUnavailableError(`Keto error: ${message}`, 'keto');
}
