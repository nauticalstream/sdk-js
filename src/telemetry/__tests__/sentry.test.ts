import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock Sentry and profiling to avoid network calls / native binaries
vi.mock('@sentry/node', () => ({
  init: vi.fn(),
  close: vi.fn().mockResolvedValue(true),
  captureException: vi.fn(),
  withScope: vi.fn(),
  onUncaughtExceptionIntegration: vi.fn().mockReturnValue({}),
  onUnhandledRejectionIntegration: vi.fn().mockReturnValue({}),
}));

vi.mock('@sentry/profiling-node', () => ({
  nodeProfilingIntegration: vi.fn().mockReturnValue({}),
}));

// Import AFTER mocks are registered
const { initSentry, closeSentry } = await import('../sentry/init');
const Sentry = await import('@sentry/node');

beforeEach(() => {
  vi.clearAllMocks();
});

// Reset sentryInitialized flag after every test so each starts clean
afterEach(async () => {
  await closeSentry();
});

describe('initSentry', () => {
  it('does nothing when enabled is false', () => {
    initSentry({ dsn: 'https://fake@sentry.io/1', environment: 'test', enabled: false });
    expect(Sentry.init).not.toHaveBeenCalled();
  });

  it('does nothing when dsn is empty', () => {
    initSentry({ dsn: '', environment: 'test', enabled: true });
    expect(Sentry.init).not.toHaveBeenCalled();
  });

  it('calls Sentry.init when enabled with a DSN', () => {
    initSentry({ dsn: 'https://fake@sentry.io/1', environment: 'test', enabled: true });
    expect(Sentry.init).toHaveBeenCalledOnce();
  });

  it('passes environment and sample rates to Sentry.init', () => {
    initSentry({
      dsn: 'https://fake@sentry.io/1',
      environment: 'production',
      enabled: true,
      tracesSampleRate: 0.5,
      profilesSampleRate: 0.2,
    });
    const [config] = (Sentry.init as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(config.environment).toBe('production');
    expect(config.tracesSampleRate).toBe(0.5);
    expect(config.profilesSampleRate).toBe(0.2);
  });

  it('logs warning and skips on second init call', async () => {
    // Reset module state by re-importing after clearing
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    // First init happened in previous test — module state carries across unless reset
    // Use a fresh import via resetModules if needed; here we rely on the guard
    initSentry({ dsn: 'https://fake@sentry.io/1', environment: 'test', enabled: true });
    initSentry({ dsn: 'https://fake@sentry.io/1', environment: 'test', enabled: true });

    expect(warn).toHaveBeenCalledWith(expect.stringContaining('[Sentry]'));
    warn.mockRestore();
  });

  it('does not throw with ignoreErrors config', () => {
    expect(() =>
      initSentry({
        dsn: 'https://fake@sentry.io/1',
        environment: 'test',
        enabled: true,
        ignoreErrors: ['ValidationError', /ECONNREFUSED/],
      })
    ).not.toThrow();
  });
});

describe('closeSentry', () => {
  it('resolves with true when Sentry was never initialized', async () => {
    await expect(closeSentry()).resolves.toBe(true);
  });

  it('calls Sentry.close with a timeout after init', async () => {
    initSentry({ dsn: 'https://fake@sentry.io/1', environment: 'test', enabled: true });
    await closeSentry();
    expect(Sentry.close).toHaveBeenCalledWith(2000);
  });

  it('resolves without throwing', async () => {
    initSentry({ dsn: 'https://fake@sentry.io/1', environment: 'test', enabled: true });
    await expect(closeSentry()).resolves.toBeDefined();
  });

  it('can be called multiple times without throwing', async () => {
    await expect(closeSentry()).resolves.toBeDefined();
    await expect(closeSentry()).resolves.toBeDefined();
  });
});
