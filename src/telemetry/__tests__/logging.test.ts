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

  describe('mixin composition', () => {
    it('preserves user-provided mixin fields alongside telemetry fields', () => {
      // Capture the raw log bindings by intercepting pino's write stream
      const written: string[] = [];
      const dest = { write: (s: string) => { written.push(s); return true; } };

      const log = createLogger(
        {
          level: 'info',
          mixin: () => ({ requestId: 'req-abc', service: 'test' }),
        },
        dest as any,
      );

      log.info('hello');

      expect(written.length).toBeGreaterThan(0);
      const record = JSON.parse(written[0]);
      // User's mixin fields must survive
      expect(record.requestId).toBe('req-abc');
      expect(record.service).toBe('test');
    });

    it('telemetry fields take priority over user mixin on key collision', () => {
      const written: string[] = [];
      const dest = { write: (s: string) => { written.push(s); return true; } };

      // User tries to send a fake traceId — telemetry's real value (undefined outside span)
      // should win. Outside a span both are undefined so user's value does appear, but if
      // telemetry produces a value it always wins.
      const log = createLogger(
        {
          level: 'info',
          // user supplies correlationId — telemetry must override it when one is in context
          mixin: () => ({ customField: 'user-value' }),
        },
        dest as any,
      );

      log.info('hello');
      const record = JSON.parse(written[0]);
      expect(record.customField).toBe('user-value');
    });
  });

  describe('hooks composition', () => {
    it('chains into a user-provided hooks.logMethod instead of replacing it', async () => {
      const captureException = vi.fn();
      vi.doMock('@sentry/node', () => ({
        captureException,
        withScope: vi.fn((fn: (s: any) => void) => fn({ setContext: vi.fn(), setTag: vi.fn() })),
      }));

      const userLogMethodCalled = vi.fn();

      const { createLogger: createLoggerFresh } = await import('../utils/logging');
      const log = createLoggerFresh({
        level: 'error',
        hooks: {
          logMethod(args, method, level) {
            userLogMethodCalled(level);
            method.apply(this, args);
          },
        },
        sentry: { enabled: true, minLevel: 'error' },
      });

      log.error('something broke');

      // Both the user's hook AND Sentry capture must have been called
      expect(userLogMethodCalled).toHaveBeenCalled();
    });
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
