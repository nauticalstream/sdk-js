import { describe, it, expect } from 'vitest';
import { classifyMQTTError } from '../errors/classifyMQTTError';
import {
  SystemException,
  DomainException,
  NetworkError,
  ServiceUnavailableError,
  UnauthorizedError,
  ValidationError,
  TimeoutError,
} from '../../errors';

function errWithCode(message: string, code: number): Error {
  const e = new Error(message) as Error & { code: number };
  e.code = code;
  return e;
}

describe('classifyMQTTError', () => {
  describe('pass-through for already-classified errors', () => {
    it('returns SystemException as-is', () => {
      const e = new ServiceUnavailableError('already');
      expect(classifyMQTTError(e)).toBe(e);
    });

    it('returns DomainException as-is', () => {
      const e = new ValidationError('already');
      expect(classifyMQTTError(e)).toBe(e);
    });
  });

  describe('non-Error values', () => {
    it('wraps undefined in ServiceUnavailableError', () => {
      expect(classifyMQTTError(undefined)).toBeInstanceOf(ServiceUnavailableError);
    });

    it('wraps a plain object in ServiceUnavailableError', () => {
      expect(classifyMQTTError({ reason: 'fail' })).toBeInstanceOf(ServiceUnavailableError);
    });
  });

  describe('MQTT error codes → validation (non-retryable)', () => {
    it('code 132 (malformed packet) → ValidationError', () => {
      expect(classifyMQTTError(errWithCode('packet error', 132))).toBeInstanceOf(ValidationError);
    });

    it('code 138 → ValidationError', () => {
      expect(classifyMQTTError(errWithCode('bad format', 138))).toBeInstanceOf(ValidationError);
    });

    it('"malformed" message → ValidationError', () => {
      expect(classifyMQTTError(new Error('malformed MQTT frame'))).toBeInstanceOf(ValidationError);
    });

    it('ValidationError is a DomainException', () => {
      expect(classifyMQTTError(errWithCode('', 132))).toBeInstanceOf(DomainException);
    });
  });

  describe('auth errors → UnauthorizedError (non-retryable)', () => {
    it('code 130 → UnauthorizedError', () => {
      expect(classifyMQTTError(errWithCode('auth', 130))).toBeInstanceOf(UnauthorizedError);
    });

    it('code 135 → UnauthorizedError', () => {
      expect(classifyMQTTError(errWithCode('auth', 135))).toBeInstanceOf(UnauthorizedError);
    });

    it('"not authorized" message → UnauthorizedError', () => {
      expect(classifyMQTTError(new Error('client not authorized'))).toBeInstanceOf(UnauthorizedError);
    });

    it('UnauthorizedError is a DomainException', () => {
      expect(classifyMQTTError(new Error('unauthorized'))).toBeInstanceOf(DomainException);
    });
  });

  describe('broker / server availability errors → ServiceUnavailableError (retryable)', () => {
    it('code 131 (server unavailable) → ServiceUnavailableError', () => {
      expect(classifyMQTTError(errWithCode('unavailable', 131))).toBeInstanceOf(ServiceUnavailableError);
    });

    it('code 136 (server moving) → ServiceUnavailableError', () => {
      expect(classifyMQTTError(errWithCode('moving', 136))).toBeInstanceOf(ServiceUnavailableError);
    });

    it('code 137 (rate limited) → ServiceUnavailableError', () => {
      expect(classifyMQTTError(errWithCode('rate limited', 137))).toBeInstanceOf(ServiceUnavailableError);
    });

    it('"ECONNREFUSED" message → ServiceUnavailableError', () => {
      expect(classifyMQTTError(new Error('ECONNREFUSED broker:1883'))).toBeInstanceOf(ServiceUnavailableError);
    });

    it('ServiceUnavailableError is a SystemException', () => {
      expect(classifyMQTTError(errWithCode('unavailable', 131))).toBeInstanceOf(SystemException);
    });
  });

  describe('timeout errors → TimeoutError (retryable)', () => {
    it('"timeout" message → TimeoutError', () => {
      expect(classifyMQTTError(new Error('publish timeout'))).toBeInstanceOf(TimeoutError);
    });

    it('"ETIMEDOUT" → TimeoutError', () => {
      expect(classifyMQTTError(new Error('ETIMEDOUT'))).toBeInstanceOf(TimeoutError);
    });

    it('"EHOSTUNREACH" → TimeoutError', () => {
      expect(classifyMQTTError(new Error('EHOSTUNREACH'))).toBeInstanceOf(TimeoutError);
    });

    it('TimeoutError is a SystemException', () => {
      expect(classifyMQTTError(new Error('timeout'))).toBeInstanceOf(SystemException);
    });
  });

  describe('network errors → NetworkError (retryable)', () => {
    it('"ECONNRESET" → NetworkError', () => {
      expect(classifyMQTTError(new Error('ECONNRESET'))).toBeInstanceOf(NetworkError);
    });

    it('"ENOTFOUND" → NetworkError', () => {
      expect(classifyMQTTError(new Error('ENOTFOUND broker.internal'))).toBeInstanceOf(NetworkError);
    });

    it('"socket" → NetworkError', () => {
      expect(classifyMQTTError(new Error('socket hang up'))).toBeInstanceOf(NetworkError);
    });

    it('"DNS" → NetworkError', () => {
      expect(classifyMQTTError(new Error('DNS lookup failed'))).toBeInstanceOf(NetworkError);
    });

    it('NetworkError is a SystemException', () => {
      expect(classifyMQTTError(new Error('ECONNRESET'))).toBeInstanceOf(SystemException);
    });
  });

  describe('unknown errors → ServiceUnavailableError (default retryable)', () => {
    it('plain Error with unfamiliar message → ServiceUnavailableError', () => {
      expect(classifyMQTTError(new Error('some strange MQTT issue'))).toBeInstanceOf(ServiceUnavailableError);
    });
  });
});
