import { describe, it, expect } from 'vitest';
import * as grpc from '@grpc/grpc-js';
import { classifyPermissionError } from '../errors/classifyPermissionError.js';
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
} from '../../errors/index.js';

describe('classifyPermissionError', () => {
  describe('pass-through for already-classified errors', () => {
    it('returns SystemException as-is', () => {
      const e = new ServiceUnavailableError('already classified');
      expect(classifyPermissionError(e)).toBe(e);
    });

    it('returns DomainException as-is', () => {
      const e = new ValidationError('already classified');
      expect(classifyPermissionError(e)).toBe(e);
    });
  });

  describe('non-Error values', () => {
    it('wraps null in ServiceUnavailableError', () => {
      const result = classifyPermissionError(null);
      expect(result).toBeInstanceOf(ServiceUnavailableError);
    });

    it('wraps a plain string in ServiceUnavailableError', () => {
      expect(classifyPermissionError('something broke')).toBeInstanceOf(ServiceUnavailableError);
    });
  });

  describe('network / connection errors → NetworkError (retryable)', () => {
    const networkMessages = [
      'ECONNREFUSED connecting to permissions',
      'ENOTFOUND permissions.internal',
      'EHOSTUNREACH',
      'connection refused by host',
      'network error occurred',
    ];

    for (const msg of networkMessages) {
      it(`"${msg}" → NetworkError`, () => {
        expect(classifyPermissionError(new Error(msg))).toBeInstanceOf(NetworkError);
      });
    }

    it('NetworkError is a SystemException (retryable)', () => {
      expect(classifyPermissionError(new Error('ECONNREFUSED'))).toBeInstanceOf(SystemException);
    });
  });

  describe('timeout errors → TimeoutError (retryable)', () => {
    const timeoutMessages = ['ETIMEDOUT', 'request timeout', 'operation timed out'];

    for (const msg of timeoutMessages) {
      it(`"${msg}" → TimeoutError`, () => {
        expect(classifyPermissionError(new Error(msg))).toBeInstanceOf(TimeoutError);
      });
    }

    it('TimeoutError is a SystemException (retryable)', () => {
      expect(classifyPermissionError(new Error('ETIMEDOUT'))).toBeInstanceOf(SystemException);
    });
  });

  describe('HTTP status codes', () => {
    function errorWithStatus(status: number): Error {
      return new Error(`Request failed with status code ${status}`);
    }

    it('400 → ValidationError (non-retryable)', () => {
      expect(classifyPermissionError(errorWithStatus(400))).toBeInstanceOf(ValidationError);
    });

    it('400 is a DomainException', () => {
      expect(classifyPermissionError(errorWithStatus(400))).toBeInstanceOf(DomainException);
    });

    it('401 → UnauthorizedError', () => {
      expect(classifyPermissionError(errorWithStatus(401))).toBeInstanceOf(UnauthorizedError);
    });

    it('403 → ForbiddenError', () => {
      expect(classifyPermissionError(errorWithStatus(403))).toBeInstanceOf(ForbiddenError);
    });

    it('404 → NotFoundError', () => {
      expect(classifyPermissionError(errorWithStatus(404))).toBeInstanceOf(NotFoundError);
    });

    it('429 → ServiceUnavailableError (rate limit, retryable)', () => {
      const result = classifyPermissionError(errorWithStatus(429));
      expect(result).toBeInstanceOf(ServiceUnavailableError);
      expect(result).toBeInstanceOf(SystemException);
    });

    it('500 → ServiceUnavailableError (retryable)', () => {
      expect(classifyPermissionError(errorWithStatus(500))).toBeInstanceOf(ServiceUnavailableError);
    });

    it('arbitrary 4xx not covered above → ValidationError (non-retryable)', () => {
      expect(classifyPermissionError(errorWithStatus(422))).toBeInstanceOf(ValidationError);
    });
  });

  describe('gRPC status codes', () => {
    function errorWithGrpcCode(code: number, message: string): Error {
      return Object.assign(new Error(message), { code });
    }

    it('INVALID_ARGUMENT → ValidationError', () => {
      expect(
        classifyPermissionError(errorWithGrpcCode(grpc.status.INVALID_ARGUMENT, 'invalid tuple'))
      ).toBeInstanceOf(ValidationError);
    });

    it('UNAUTHENTICATED → UnauthorizedError', () => {
      expect(
        classifyPermissionError(errorWithGrpcCode(grpc.status.UNAUTHENTICATED, 'missing token'))
      ).toBeInstanceOf(UnauthorizedError);
    });

    it('PERMISSION_DENIED → ForbiddenError', () => {
      expect(
        classifyPermissionError(errorWithGrpcCode(grpc.status.PERMISSION_DENIED, 'denied'))
      ).toBeInstanceOf(ForbiddenError);
    });

    it('NOT_FOUND → NotFoundError', () => {
      expect(
        classifyPermissionError(errorWithGrpcCode(grpc.status.NOT_FOUND, 'missing relation'))
      ).toBeInstanceOf(NotFoundError);
    });

    it('DEADLINE_EXCEEDED → TimeoutError', () => {
      expect(
        classifyPermissionError(errorWithGrpcCode(grpc.status.DEADLINE_EXCEEDED, 'deadline exceeded'))
      ).toBeInstanceOf(TimeoutError);
    });

    it('UNAVAILABLE → ServiceUnavailableError', () => {
      expect(
        classifyPermissionError(errorWithGrpcCode(grpc.status.UNAVAILABLE, 'backend unavailable'))
      ).toBeInstanceOf(ServiceUnavailableError);
    });
  });

  describe('unknown error → ServiceUnavailableError (default to retryable)', () => {
    it('plain Error with unfamiliar message → ServiceUnavailableError', () => {
      expect(classifyPermissionError(new Error('some weird permissions thing'))).toBeInstanceOf(ServiceUnavailableError);
    });
  });
});