import { describe, it, expect, vi } from 'vitest';
import { withErrorBoundary } from '../formatters/subscriber/withErrorBoundary';
import { ValidationError } from '../domain/ValidationError';
import { NotFoundError } from '../domain/NotFoundError';
import { ServiceUnavailableError } from '../system/ServiceUnavailableError';
import { DatabaseError } from '../system/DatabaseError';
import { DomainException } from '../base/DomainException';
import { ErrorCode, ErrorSeverity } from '@nauticalstream/proto/error/v1/codes_pb';

/** A DomainException that is marked RETRYABLE — tests the rare retryable-domain path */
class RetryableDomainError extends DomainException {
  readonly errorCode = ErrorCode.INTERNAL_ERROR;
  readonly severity = ErrorSeverity.RETRYABLE;
  readonly httpStatus = 500;
  readonly graphqlCode = 'RETRYABLE_DOMAIN';
  constructor(msg: string) { super(msg); }
}

function makeLogger() {
  return { warn: vi.fn(), error: vi.fn() };
}

describe('withErrorBoundary', () => {
  describe('success path', () => {
    it('calls the handler and resolves when no error is thrown', async () => {
      const handler = vi.fn().mockResolvedValue(undefined);
      const wrapped = withErrorBoundary('test.subject', handler);
      await expect(wrapped({ id: 1 })).resolves.toBeUndefined();
      expect(handler).toHaveBeenCalledWith({ id: 1 });
    });
  });

  describe('non-retryable DomainException (CLIENT_ERROR / FATAL) → ack (no throw)', () => {
    it('ValidationError is swallowed — message is acked', async () => {
      const handler = vi.fn().mockRejectedValue(new ValidationError('bad input'));
      const wrapped = withErrorBoundary('test.subject', handler);
      // Must NOT throw
      await expect(wrapped({})).resolves.toBeUndefined();
    });

    it('NotFoundError is swallowed', async () => {
      const handler = vi.fn().mockRejectedValue(new NotFoundError('User', '42'));
      await expect(withErrorBoundary('test.subject', handler)({})).resolves.toBeUndefined();
    });

    it('logs a warn for the discarded message', async () => {
      const log = makeLogger();
      const handler = vi.fn().mockRejectedValue(new ValidationError('field missing'));
      await withErrorBoundary('my.subject', handler, log)({});
      expect(log.warn).toHaveBeenCalledOnce();
      const [logObj] = log.warn.mock.calls[0];
      expect((logObj as any).subject).toBe('my.subject');
    });
  });

  describe('retryable DomainException (RETRYABLE severity) → throw', () => {
    it('re-throws so JetStream can retry', async () => {
      const err = new RetryableDomainError('transient domain fail');
      const handler = vi.fn().mockRejectedValue(err);
      await expect(withErrorBoundary('test.subject', handler)({})).rejects.toBe(err);
    });

    it('logs a warn before re-throwing', async () => {
      const log = makeLogger();
      const err = new RetryableDomainError('retry me');
      await withErrorBoundary('test.subject', vi.fn().mockRejectedValue(err), log)({}).catch(() => null);
      expect(log.warn).toHaveBeenCalledOnce();
    });
  });

  describe('SystemException → always throw', () => {
    it('re-throws ServiceUnavailableError', async () => {
      const err = new ServiceUnavailableError('svc down');
      const handler = vi.fn().mockRejectedValue(err);
      await expect(withErrorBoundary('test.subject', handler)({})).rejects.toBe(err);
    });

    it('re-throws DatabaseError', async () => {
      const err = new DatabaseError('timeout');
      await expect(withErrorBoundary('test.subject', vi.fn().mockRejectedValue(err))({})).rejects.toBe(err);
    });

    it('logs a warn for system errors', async () => {
      const log = makeLogger();
      const err = new ServiceUnavailableError('down');
      await withErrorBoundary('test.subject', vi.fn().mockRejectedValue(err), log)({}).catch(() => null);
      expect(log.warn).toHaveBeenCalledOnce();
    });
  });

  describe('unknown / plain errors → always throw', () => {
    it('re-throws a plain Error', async () => {
      const err = new Error('unexpected bug');
      await expect(withErrorBoundary('test.subject', vi.fn().mockRejectedValue(err))({})).rejects.toBe(err);
    });

    it('re-throws a non-Error value', async () => {
      await expect(withErrorBoundary('test.subject', vi.fn().mockRejectedValue('oops'))({})).rejects.toBe('oops');
    });

    it('logs an error (not warn) for unknown errors', async () => {
      const log = makeLogger();
      await withErrorBoundary('test.subject', vi.fn().mockRejectedValue(new Error('bug')), log)({}).catch(() => null);
      expect(log.error).toHaveBeenCalledOnce();
      expect(log.warn).not.toHaveBeenCalled();
    });
  });

});
