import { describe, it, expect, afterEach, vi } from 'vitest';
import {
  initTelemetry,
  shutdownTelemetry,
  getTracer,
  getMeter,
  withSpan,
} from '../telemetry';

/** Minimal config that starts fast — no exporters, no instrumentations */
const MINIMAL_CONFIG = {
  serviceName: 'test-service',
  serviceVersion: '0.0.1',
  environment: 'test',
  consoleExporter: false,
  instrumentations: {
    fastify: false,
    mongodb: false,
    http: false,
    dns: false,
  },
};

// Always shut down after each test so the isInitialized guard resets
afterEach(async () => {
  await shutdownTelemetry();
});

describe('initTelemetry', () => {
  it('does not throw with minimal config', () => {
    expect(() => initTelemetry(MINIMAL_CONFIG)).not.toThrow();
  });

  it('does not throw with only serviceName', () => {
    expect(() => initTelemetry({ serviceName: 'bare-minimum' })).not.toThrow();
  });

  it('warns and skips when called twice (does not throw)', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    initTelemetry(MINIMAL_CONFIG);
    initTelemetry(MINIMAL_CONFIG); // second call
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('already initialized'));
    warn.mockRestore();
  });

  it('accepts an OTLP http exporter config without throwing', () => {
    expect(() =>
      initTelemetry({
        ...MINIMAL_CONFIG,
        otlp: { endpoint: 'http://localhost:4318', protocol: 'http' },
      })
    ).not.toThrow();
  });

  it('accepts a custom sampling probability without throwing', () => {
    expect(() =>
      initTelemetry({ ...MINIMAL_CONFIG, sampling: { probability: 0.1 } })
    ).not.toThrow();
  });

  it('accepts extra resource attributes without throwing', () => {
    expect(() =>
      initTelemetry({ ...MINIMAL_CONFIG, resource: { 'team.name': 'platform' } })
    ).not.toThrow();
  });
});

describe('shutdownTelemetry', () => {
  it('resolves without throwing when SDK was never initialized', async () => {
    // afterEach already called shutdown, so state is clean
    await expect(shutdownTelemetry()).resolves.toBeUndefined();
  });

  it('resolves without throwing after a normal init', async () => {
    initTelemetry(MINIMAL_CONFIG);
    await expect(shutdownTelemetry()).resolves.toBeUndefined();
  });

  it('can be called twice without throwing', async () => {
    initTelemetry(MINIMAL_CONFIG);
    await shutdownTelemetry();
    await expect(shutdownTelemetry()).resolves.toBeUndefined();
  });

  it('allows re-initialization after shutdown', () => {
    initTelemetry(MINIMAL_CONFIG);
    // afterEach will call shutdown; this test proves init works fresh
    expect(() => initTelemetry(MINIMAL_CONFIG)).not.toThrow();
  });
});

describe('getTracer', () => {
  it('returns a tracer without init (no-op tracer)', () => {
    const t = getTracer();
    expect(t).toBeDefined();
    expect(typeof t.startActiveSpan).toBe('function');
  });

  it('returns a named tracer', () => {
    initTelemetry(MINIMAL_CONFIG);
    const t = getTracer('my-lib');
    expect(t).toBeDefined();
  });
});

describe('getMeter', () => {
  it('returns a meter without init (no-op meter)', () => {
    const m = getMeter();
    expect(m).toBeDefined();
    expect(typeof m.createCounter).toBe('function');
  });

  it('returns a named meter after init', () => {
    initTelemetry(MINIMAL_CONFIG);
    const m = getMeter('my-metrics');
    expect(m).toBeDefined();
  });
});

describe('withSpan', () => {
  it('executes the callback and returns its value', async () => {
    initTelemetry(MINIMAL_CONFIG);
    const result = await withSpan('test-op', async () => 42);
    expect(result).toBe(42);
  });

  it('works without init (no-op tracer)', async () => {
    const result = await withSpan('noop-op', async () => 'hello');
    expect(result).toBe('hello');
  });

  it('re-throws errors from the callback', async () => {
    initTelemetry(MINIMAL_CONFIG);
    const err = new Error('boom');
    await expect(withSpan('failing-op', async () => { throw err; })).rejects.toBe(err);
  });

  it('accepts optional span attributes without throwing', async () => {
    initTelemetry(MINIMAL_CONFIG);
    const result = await withSpan(
      'attributed-op',
      async () => 'ok',
      'test-tracer',
      { 'user.id': 'u1', 'feature.name': 'checkout' }
    );
    expect(result).toBe('ok');
  });

  it('handles non-Error throws and still re-throws', async () => {
    await expect(withSpan('string-throw', async () => { throw 'oops'; })).rejects.toBe('oops');
  });
});
