import { describe, it, expect } from 'vitest';
import { classifyKetoError } from '../errors/classifyKetoError';
import {
  SystemException,
  DomainException,
  NetworkError,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ServiceUnavailableError,
  TimeoutError,
} from '../../errors';

describe('classifyKetoError', () => {
  describe('pass-through for already-classified errors', () => {
    it('returns SystemException as-is', () => {
      const e = new ServiceUnavailableError('already classified');
      expect(classifyKetoError(e)).toBe(e);
    });

    it('returns DomainException as-is', () => {
      const e = new ValidationError('already classified');
      expect(classifyKetoError(e)).toBe(e);
    });
  });

  describe('non-Error values', () => {
    it('wraps null in ServiceUnavailableError', () => {
      const result = classifyKetoError(null);
      expect(result).toBeInstanceOf(ServiceUnavailableError);
    });

    it('wraps a plain string in ServiceUnavailableError', () => {
      expect(classifyKetoError('something broke')).toBeInstanceOf(ServiceUnavailableError);
    });
  });

  describe('network / connection errors → NetworkError (retryable)', () => {
    const networkMessages = [
      'ECONNREFUSED connecting to keto',
      'ENOTFOUND keto.internal',
      'EHOSTUNREACH',
      'connection refused by host',
      'network error occurred',
    ];

    for (const msg of networkMessages) {
      it(`"${msg}" → NetworkError`, () => {
        expect(classifyKetoError(new Error(msg))).toBeInstanceOf(NetworkError);
      });
    }

    it('NetworkError is a SystemException (retryable)', () => {
      expect(classifyKetoError(new Error('ECONNREFUSED'))).toBeInstanceOf(SystemException);
    });
  });

  describe('timeout errors → TimeoutError (retryable)', () => {
    const timeoutMessages = ['ETIMEDOUT', 'request timeout', 'operation timed out'];

    for (const msg of timeoutMessages) {
      it(`"${msg}" → TimeoutError`, () => {
        expect(classifyKetoError(new Error(msg))).toBeInstanceOf(TimeoutError);
      });
    }

    it('TimeoutError is a SystemException (retryable)', () => {
      expect(classifyKetoError(new Error('ETIMEDOUT'))).toBeInstanceOf(SystemException);
    });
  });

  describe('HTTP status codes', () => {
    function errorWithStatus(status: number): Error {
      return new Error(`Request failed with status code ${status}`);
    }

    it('400 → ValidationError (non-retryable)', () => {
      expect(classifyKetoError(errorWithStatus(400))).toBeInstanceOf(ValidationError);
    });

    it('400 is a DomainException', () => {
      expect(classifyKetoError(errorWithStatus(400))).toBeInstanceOf(DomainException);
    });

    it('401 → UnauthorizedError', () => {
      expect(classifyKetoError(errorWithStatus(401))).toBeInstanceOf(UnauthorizedError);
    });

    it('403 → ForbiddenError', () => {
      expect(classifyKetoError(errorWithStatus(403))).toBeInstanceOf(ForbiddenError);
    });

    it('404 → NotFoundError', () => {
      expect(classifyKetoError(errorWithStatus(404))).toBeInstanceOf(NotFoundError);
    });

    it('429 → ServiceUnavailableError (rate limit, retryable)', () => {
      const result = classifyKetoError(errorWithStatus(429));
      expect(result).toBeInstanceOf(ServiceUnavailableError);
      expect(result).toBeInstanceOf(SystemException);
    });

    it('500 → ServiceUnavailableError (retryable)', () => {
      expect(classifyKetoError(errorWithStatus(500))).toBeInstanceOf(ServiceUnavailableError);
    });

    it('502 → ServiceUnavailableError (retryable)', () => {
      expect(classifyKetoError(errorWithStatus(502))).toBeInstanceOf(ServiceUnavailableError);
    });

    it('503 → ServiceUnavailableError (retryable)', () => {
      expect(classifyKetoError(errorWithStatus(503))).toBeInstanceOf(ServiceUnavailableError);
    });

    it('504 → ServiceUnavailableError (retryable)', () => {
      expect(classifyKetoError(errorWithStatus(504))).toBeInstanceOf(ServiceUnavailableError);
    });

    it('arbitrary 5xx → ServiceUnavailableError (retryable)', () => {
      expect(classifyKetoError(errorWithStatus(599))).toBeInstanceOf(ServiceUnavailableError);
    });

    it('arbitrary 4xx not covered above → ValidationError (non-retryable)', () => {
      expect(classifyKetoError(errorWithStatus(422))).toBeInstanceOf(ValidationError);
    });
  });

  describe('unknown error → ServiceUnavailableError (default to retryable)', () => {
    it('plain Error with unfamiliar message → ServiceUnavailableError', () => {
      expect(classifyKetoError(new Error('some weird keto thing'))).toBeInstanceOf(ServiceUnavailableError);
    });
  });
});
