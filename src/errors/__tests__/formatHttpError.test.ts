import { describe, it, expect } from 'vitest';
import { formatHttpError } from '../formatters/http/formatHttpError';
import { NotFoundError } from '../domain/NotFoundError';
import { ValidationError } from '../domain/ValidationError';
import { UnauthorizedError } from '../domain/UnauthorizedError';
import { ForbiddenError } from '../domain/ForbiddenError';
import { ConflictError } from '../domain/ConflictError';
import { ServiceUnavailableError } from '../system/ServiceUnavailableError';
import { NetworkError } from '../system/NetworkError';
import { DatabaseError } from '../system/DatabaseError';

describe('formatHttpError', () => {
  describe('DomainException subclasses', () => {
    it('NotFoundError → 404 with NOT_FOUND code and message', () => {
      const err = new NotFoundError('Conversation', 'abc123');
      const result = formatHttpError(err);
      expect(result.statusCode).toBe(404);
      expect(result.error).toBe('NOT_FOUND');
      expect(result.message).toBe('Conversation with id abc123 not found');
    });

    it('ValidationError → 400 with VALIDATION_ERROR code', () => {
      const result = formatHttpError(new ValidationError('Name is required'));
      expect(result.statusCode).toBe(400);
      expect(result.error).toBe('VALIDATION_ERROR');
      expect(result.message).toBe('Name is required');
    });

    it('UnauthorizedError → 401', () => {
      expect(formatHttpError(new UnauthorizedError('bad token'))).toMatchObject({ statusCode: 401 });
    });

    it('ForbiddenError → 403', () => {
      expect(formatHttpError(new ForbiddenError('no access'))).toMatchObject({ statusCode: 403 });
    });

    it('ConflictError → 409', () => {
      expect(formatHttpError(new ConflictError('already exists'))).toMatchObject({ statusCode: 409 });
    });

    it('includes an errorCode on domain exceptions', () => {
      const result = formatHttpError(new NotFoundError('User', '1'));
      expect(typeof result.errorCode).toBe('number');
    });

    it('includes a correlationId string', () => {
      const result = formatHttpError(new ValidationError('x'));
      expect(typeof result.correlationId).toBe('string');
      expect(result.correlationId!.length).toBeGreaterThan(0);
    });
  });

  describe('SystemException subclasses', () => {
    it('ServiceUnavailableError → 503', () => {
      const result = formatHttpError(new ServiceUnavailableError('svc down'));
      expect(result.statusCode).toBe(503);
      expect(result.message).toBe('svc down');
    });

    it('NetworkError → 500', () => {
      expect(formatHttpError(new NetworkError('refused'))).toMatchObject({ statusCode: 500 });
    });

    it('DatabaseError → 500', () => {
      expect(formatHttpError(new DatabaseError('timeout'))).toMatchObject({ statusCode: 500 });
    });

    it('includes a correlationId string on system exceptions', () => {
      const result = formatHttpError(new ServiceUnavailableError('down'));
      expect(typeof result.correlationId).toBe('string');
    });
  });

  describe('unknown / plain errors', () => {
    it('plain Error → 500 INTERNAL_SERVER_ERROR with generic message', () => {
      const result = formatHttpError(new Error('secret DB query details'));
      expect(result.statusCode).toBe(500);
      expect(result.error).toBe('INTERNAL_SERVER_ERROR');
      expect(result.message).toBe('An unexpected error occurred');
    });

    it('hides internal details from plain errors', () => {
      const secret = 'SELECT * FROM users WHERE password=abc';
      const result = formatHttpError(new Error(secret));
      expect(result.message).not.toContain(secret);
    });

    it('null → 500 INTERNAL_SERVER_ERROR', () => {
      expect(formatHttpError(null)).toMatchObject({ statusCode: 500, error: 'INTERNAL_SERVER_ERROR' });
    });

    it('string → 500 INTERNAL_SERVER_ERROR', () => {
      expect(formatHttpError('oops')).toMatchObject({ statusCode: 500 });
    });
  });
});
