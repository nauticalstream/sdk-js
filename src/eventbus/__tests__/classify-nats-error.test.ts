import { describe, it, expect } from 'vitest';
import { classifyNatsError } from '../errors/classify';
import {
  SystemException,
  DomainException,
  NetworkError,
  ServiceUnavailableError,
  UnauthorizedError,
  ValidationError,
  TimeoutError,
} from '../../errors';

describe('classifyNatsError', () => {
  describe('pass-through for already-classified errors', () => {
    it('returns SystemException as-is', () => {
      const e = new ServiceUnavailableError('already typed');
      expect(classifyNatsError(e)).toBe(e);
    });

    it('returns DomainException as-is', () => {
      const e = new ValidationError('already typed');
      expect(classifyNatsError(e)).toBe(e);
    });
  });

  describe('non-Error values', () => {
    it('wraps null in ServiceUnavailableError', () => {
      expect(classifyNatsError(null)).toBeInstanceOf(ServiceUnavailableError);
    });

    it('wraps a plain number in ServiceUnavailableError', () => {
      expect(classifyNatsError(42)).toBeInstanceOf(ServiceUnavailableError);
    });
  });

  describe('connection errors → NetworkError (retryable)', () => {
    const msgs = [
      'disconnected from server',
      'lost connection to nats',
      'ECONNREFUSED 127.0.0.1:4222',
      'connection refused',
    ];

    for (const msg of msgs) {
      it(`"${msg}" → NetworkError`, () => {
        expect(classifyNatsError(new Error(msg))).toBeInstanceOf(NetworkError);
      });
    }

    it('NetworkError is a SystemException', () => {
      expect(classifyNatsError(new Error('disconnected'))).toBeInstanceOf(SystemException);
    });
  });

  describe('timeout errors → TimeoutError (retryable)', () => {
    it('"timeout" → TimeoutError', () => {
      expect(classifyNatsError(new Error('publish timeout'))).toBeInstanceOf(TimeoutError);
    });

    it('"ETIMEDOUT" → TimeoutError', () => {
      expect(classifyNatsError(new Error('ETIMEDOUT'))).toBeInstanceOf(TimeoutError);
    });

    it('TimeoutError is a SystemException', () => {
      expect(classifyNatsError(new Error('timeout'))).toBeInstanceOf(SystemException);
    });
  });

  describe('subject / format errors → ValidationError (non-retryable)', () => {
    it('"invalid subject" → ValidationError', () => {
      expect(classifyNatsError(new Error('invalid subject: foo..bar'))).toBeInstanceOf(ValidationError);
    });

    it('"bad subject" → ValidationError', () => {
      expect(classifyNatsError(new Error('bad subject format'))).toBeInstanceOf(ValidationError);
    });

    it('ValidationError is a DomainException', () => {
      expect(classifyNatsError(new Error('invalid subject'))).toBeInstanceOf(DomainException);
    });
  });

  describe('auth errors → UnauthorizedError (non-retryable)', () => {
    it('"authorization" → UnauthorizedError', () => {
      expect(classifyNatsError(new Error('authorization violation'))).toBeInstanceOf(UnauthorizedError);
    });

    it('"unauthorized" → UnauthorizedError', () => {
      expect(classifyNatsError(new Error('client is unauthorized'))).toBeInstanceOf(UnauthorizedError);
    });

    it('UnauthorizedError is a DomainException', () => {
      expect(classifyNatsError(new Error('unauthorized'))).toBeInstanceOf(DomainException);
    });
  });

  describe('unknown errors → ServiceUnavailableError (default retryable)', () => {
    it('plain Error with unfamiliar message → ServiceUnavailableError', () => {
      expect(classifyNatsError(new Error('some weird NATS thing'))).toBeInstanceOf(ServiceUnavailableError);
    });

    it('ServiceUnavailableError is a SystemException', () => {
      expect(classifyNatsError(new Error('something happened'))).toBeInstanceOf(SystemException);
    });
  });
});
