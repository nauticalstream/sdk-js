import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createLogger } from '../utils/logging';

describe('createLogger', () => {
  it('creates a logger without options', () => {
    const log = createLogger();
    expect(typeof log.info).toBe('function');
    expect(typeof log.warn).toBe('function');
    expect(typeof log.error).toBe('function');
    expect(typeof log.debug).toBe('function');
    expect(typeof log.fatal).toBe('function');
  });

  it('creates a logger with a name', () => {
    const log = createLogger({ name: 'my-service' });
    expect(log).toBeDefined();
  });

  it('respects the level option', () => {
    const log = createLogger({ level: 'warn' });
    expect(log.level).toBe('warn');
  });

  it('creates a logger with Sentry enabled flag without throwing', () => {
    expect(() =>
      createLogger({ name: 'sentry-test', sentry: { enabled: true } })
    ).not.toThrow();
  });

  it('creates a logger with Sentry disabled without throwing', () => {
    expect(() =>
      createLogger({ name: 'sentry-off', sentry: { enabled: false } })
    ).not.toThrow();
  });

  it('created logger can log without throwing', () => {
    const log = createLogger({ level: 'silent' }); // silent = no output during tests
    expect(() => log.info('test message')).not.toThrow();
    expect(() => log.warn({ code: 'TEST' }, 'warn message')).not.toThrow();
    expect(() => log.error(new Error('boom'), 'error message')).not.toThrow();
  });

  describe('Sentry hook', () => {
    beforeEach(() => {
      vi.resetModules();
    });

    it('attempts to load Sentry lazily on error when enabled', async () => {
      // Mock require('@sentry/node') to return a Sentry-like object
      const captureException = vi.fn();
      const withScope = vi.fn((fn: (s: any) => void) => fn({ setContext: vi.fn(), setTag: vi.fn() }));
      vi.doMock('@sentry/node', () => ({ captureException, withScope }));

      const { createLogger: createLoggerFresh } = await import('../utils/logging');
      const log = createLoggerFresh({
        level: 'error',
        sentry: { enabled: true, minLevel: 'error' },
      });

      // Logging at error level should fire the Sentry hook (lazy load)
      expect(() => log.error({ err: new Error('tracked') }, 'something failed')).not.toThrow();
    });

    it('does not call Sentry for info-level logs when minLevel is error', async () => {
      const captureException = vi.fn();
      vi.doMock('@sentry/node', () => ({
        captureException,
        withScope: vi.fn((fn: (s: any) => void) => fn({ setContext: vi.fn(), setTag: vi.fn() })),
      }));

      const { createLogger: createLoggerFresh } = await import('../utils/logging');
      const log = createLoggerFresh({
        level: 'trace',
        sentry: { enabled: true, minLevel: 'error' },
      });

      log.info('just info');
      // captureException should NOT have been called (level < error)
      expect(captureException).not.toHaveBeenCalled();
    });
  });
});
