import { describe, it, expect, vi } from 'vitest';
import { createFastifyLoggerAdapter } from '../logger/adapter';

// ─── helpers ────────────────────────────────────────────────────────────────

function makeMockLogger(overrides: Record<string, unknown> = {}) {
  return {
    level: 'info',
    fatal: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
    trace: vi.fn(),
    silent: vi.fn(),
    child: vi.fn().mockReturnThis(),
    ...overrides,
  };
}

// ─── tests ──────────────────────────────────────────────────────────────────

describe('createFastifyLoggerAdapter', () => {
  describe('shape', () => {
    it('exposes all required FastifyBaseLogger methods', () => {
      const adapter = createFastifyLoggerAdapter(makeMockLogger() as any);
      for (const method of ['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent', 'child']) {
        expect(typeof (adapter as any)[method]).toBe('function');
      }
    });

    it('exposes the level from the underlying logger', () => {
      const adapter = createFastifyLoggerAdapter(makeMockLogger({ level: 'debug' }) as any);
      expect(adapter.level).toBe('debug');
    });
  });

  describe('log method proxying', () => {
    it('proxies info calls to the underlying logger', () => {
      const mock = makeMockLogger();
      const adapter = createFastifyLoggerAdapter(mock as any);
      adapter.info('hello world');
      expect(mock.info).toHaveBeenCalledWith('hello world');
    });

    it('proxies error calls with an object binding', () => {
      const mock = makeMockLogger();
      const adapter = createFastifyLoggerAdapter(mock as any);
      adapter.error({ err: 'oops' }, 'something failed');
      expect(mock.error).toHaveBeenCalledWith({ err: 'oops' }, 'something failed');
    });

    it('proxies warn, debug, trace, fatal the same way', () => {
      const mock = makeMockLogger();
      const adapter = createFastifyLoggerAdapter(mock as any);
      adapter.warn('w');
      adapter.debug('d');
      adapter.trace('t');
      adapter.fatal('f');
      expect(mock.warn).toHaveBeenCalledWith('w');
      expect(mock.debug).toHaveBeenCalledWith('d');
      expect(mock.trace).toHaveBeenCalledWith('t');
      expect(mock.fatal).toHaveBeenCalledWith('f');
    });
  });

  describe('child()', () => {
    it('returns a new adapter wrapping the child logger', () => {
      const childMock = makeMockLogger({ level: 'debug' });
      const mock = makeMockLogger({ child: vi.fn().mockReturnValue(childMock) });
      const adapter = createFastifyLoggerAdapter(mock as any);

      const childAdapter = adapter.child({ requestId: 'abc' });

      expect(mock.child).toHaveBeenCalledWith({ requestId: 'abc' }, undefined);
      // The child adapter should proxy to childMock, not the parent mock
      childAdapter.info('from child');
      expect(childMock.info).toHaveBeenCalledWith('from child');
      expect(mock.info).not.toHaveBeenCalled();
    });

    it('passes options to the underlying child() call', () => {
      const childMock = makeMockLogger();
      const mock = makeMockLogger({ child: vi.fn().mockReturnValue(childMock) });
      const adapter = createFastifyLoggerAdapter(mock as any);

      const opts = { redact: ['password'] };
      adapter.child({}, opts as any);
      expect(mock.child).toHaveBeenCalledWith({}, opts);
    });

    it('child() of child() proxies to the grandchild logger', () => {
      const grandchildMock = makeMockLogger();
      const childMock = makeMockLogger({ child: vi.fn().mockReturnValue(grandchildMock) });
      const mock = makeMockLogger({ child: vi.fn().mockReturnValue(childMock) });

      const grandchildAdapter = createFastifyLoggerAdapter(mock as any)
        .child({})
        .child({ nested: true });

      grandchildAdapter.info('deep');
      expect(grandchildMock.info).toHaveBeenCalledWith('deep');
    });
  });

  describe('silent()', () => {
    it('proxies to underlying silent() when it exists', () => {
      const mock = makeMockLogger();
      const adapter = createFastifyLoggerAdapter(mock as any);
      adapter.silent('quiet');
      expect(mock.silent).toHaveBeenCalledWith('quiet');
    });

    it('provides a no-op when the underlying logger has no silent method', () => {
      const mock = makeMockLogger({ silent: undefined });
      const adapter = createFastifyLoggerAdapter(mock as any);
      expect(() => adapter.silent('ignored')).not.toThrow();
    });
  });
});
