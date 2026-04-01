import { describe, it, expect } from 'vitest';
import { shouldRetry } from '../errors.js';
import { SystemException } from '../../errors/index.js';
import { ServiceUnavailableError } from '../../errors/system/ServiceUnavailableError.js';
import { NetworkError } from '../../errors/system/NetworkError.js';
import { DatabaseError } from '../../errors/system/DatabaseError.js';
import { ValidationError } from '../../errors/domain/ValidationError.js';
import { NotFoundError } from '../../errors/domain/NotFoundError.js';
import { UnauthorizedError } from '../../errors/domain/UnauthorizedError.js';
import { ForbiddenError } from '../../errors/domain/ForbiddenError.js';

describe('shouldRetry', () => {
  describe('returns true for SystemException subclasses (infrastructure errors)', () => {
    it('ServiceUnavailableError', () => expect(shouldRetry(new ServiceUnavailableError('down'))).toBe(true));
    it('NetworkError', () => expect(shouldRetry(new NetworkError('refused'))).toBe(true));
    it('DatabaseError', () => expect(shouldRetry(new DatabaseError('timeout'))).toBe(true));
  });

  describe('returns false for DomainException subclasses (client errors)', () => {
    it('ValidationError', () => expect(shouldRetry(new ValidationError('bad field'))).toBe(false));
    it('NotFoundError', () => expect(shouldRetry(new NotFoundError('User', '123'))).toBe(false));
    it('UnauthorizedError', () => expect(shouldRetry(new UnauthorizedError('token invalid'))).toBe(false));
    it('ForbiddenError', () => expect(shouldRetry(new ForbiddenError('no access'))).toBe(false));
  });

  describe('returns false for plain Error (does not extend SystemException)', () => {
    it('plain Error', () => expect(shouldRetry(new Error('oops'))).toBe(false));
    it('TypeError', () => expect(shouldRetry(new TypeError('bad type'))).toBe(false));
    it('RangeError', () => expect(shouldRetry(new RangeError('overflow'))).toBe(false));
  });
});
