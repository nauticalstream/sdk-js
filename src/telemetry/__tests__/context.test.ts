import { describe, it, expect, beforeAll } from 'vitest';
import { context } from '@opentelemetry/api';
import { AsyncLocalStorageContextManager } from '@opentelemetry/context-async-hooks';
import {
  getCorrelationId,
  setCorrelationId,
  withCorrelationId,
  generateCorrelationId,
  getTraceId,
  getSpanId,
  getActiveSpan,
} from '../utils/context';

// OTel requires a real async-aware context manager for context propagation through await.
// The default no-op manager (used when no SDK is initialized) drops context on async boundaries.
beforeAll(() => {
  const manager = new AsyncLocalStorageContextManager();
  manager.enable();
  context.setGlobalContextManager(manager);
});

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

describe('generateCorrelationId', () => {
  it('returns a UUID v4 string', () => {
    expect(generateCorrelationId()).toMatch(UUID_REGEX);
  });

  it('returns a different ID on each call', () => {
    const a = generateCorrelationId();
    const b = generateCorrelationId();
    expect(a).not.toBe(b);
  });
});

describe('getCorrelationId', () => {
  it('returns a UUID when no correlation ID is set in context', () => {
    const id = getCorrelationId();
    expect(id).toMatch(UUID_REGEX);
  });

  it('returns a new UUID on each call when no context is set', () => {
    // Each call falls back to generateCorrelationId(), so they differ
    const a = getCorrelationId();
    const b = getCorrelationId();
    expect(a).not.toBe(b);
  });
});

describe('setCorrelationId', () => {
  it('returns a Context object with the correlation ID stored', () => {
    const ctx = setCorrelationId('my-corr-id');
    // The returned context is an OTel Context — verify it's an object
    expect(ctx).toBeDefined();
    expect(typeof ctx).toBe('object');
  });
});

describe('withCorrelationId', () => {
  it('makes getCorrelationId() return the set ID inside the callback', async () => {
    const id = 'fixed-correlation-id-for-test';
    let captured: string | undefined;

    await withCorrelationId(id, async () => {
      captured = getCorrelationId();
    });

    expect(captured).toBe(id);
  });

  it('returns the value from the callback', async () => {
    const result = await withCorrelationId('some-id', async () => 42);
    expect(result).toBe(42);
  });

  it('does not leak the correlation ID outside the callback', async () => {
    const id = 'leaked-id-test';
    await withCorrelationId(id, async () => {});

    // Outside the callback the default context has no ID set — falls back to UUID
    const outside = getCorrelationId();
    expect(outside).not.toBe(id);
    expect(outside).toMatch(UUID_REGEX);
  });
});

describe('getTraceId', () => {
  it('returns undefined when there is no active span', () => {
    expect(getTraceId()).toBeUndefined();
  });
});

describe('getSpanId', () => {
  it('returns undefined when there is no active span', () => {
    expect(getSpanId()).toBeUndefined();
  });
});

describe('getActiveSpan', () => {
  it('returns undefined when there is no active span', () => {
    expect(getActiveSpan()).toBeUndefined();
  });
});
