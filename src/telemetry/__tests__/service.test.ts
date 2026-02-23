/**
 * Unit tests for withServiceSpan.
 *
 * Strategy: mock '../utils/tracing' so we test only withServiceSpan's own
 * contract (attribute injection, error propagation, return value) — not the
 * OTel SDK internals. OTel infrastructure (span ending, error recording,
 * SpanStatusCode) is withSpan's responsibility and is tested in tracing.test.ts.
 *
 * This avoids the global-provider state issue (NodeTracerProvider.shutdown()
 * makes subsequent provider.register() calls silently produce a NoOp tracer
 * in vitest's shared module environment).
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SpanStatusCode } from '@opentelemetry/api';

// ── Mock utils/tracing before importing the module under test ─────────────────
// vi.mock is hoisted above imports by vitest, so this runs first.
vi.mock('../utils/tracing');

import { withServiceSpan } from '../utils/service';
import * as tracingModule from '../utils/tracing';

// ── Fake span factory ─────────────────────────────────────────────────────────

interface FakeSpan {
  name: string;
  attrs: Record<string, unknown>;
  ended: boolean;
  status: { code: number; message?: string } | null;
  setAttribute(k: string, v: unknown): void;
  setStatus(s: { code: number; message?: string }): void;
  recordException: ReturnType<typeof vi.fn>;
  end(): void;
  spanContext(): { traceId: string; spanId: string; traceFlags: number };
}

function makeFakeSpan(spanName: string, initialAttrs: Record<string, unknown> = {}): FakeSpan {
  const attrs: Record<string, unknown> = { ...initialAttrs };
  const span: FakeSpan = {
    name: spanName,
    attrs,
    ended: false,
    status: null,
    setAttribute: (k, v) => { attrs[k] = v; },
    setStatus: (s) => { span.status = s; },
    recordException: vi.fn(),
    end: () => { span.ended = true; },
    spanContext: () => ({ traceId: 'mock-trace-id', spanId: 'mock-span-id', traceFlags: 1 }),
  };
  return span;
}

// ── Captured call state ───────────────────────────────────────────────────────
// Populated by the withSpan mock on each invocation.

let lastCallName = '';
let lastCallOptions: Record<string, unknown> = {};
let lastSpan: FakeSpan | null = null;

// ── Setup ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  lastCallName = '';
  lastCallOptions = {};
  lastSpan = null;

  vi.mocked(tracingModule.withSpan).mockImplementation(async (name, fn, options) => {
    lastCallName = name;
    lastCallOptions = (options ?? {}) as Record<string, unknown>;

    // Apply options.attributes as initial span attributes (mirrors real withSpan behaviour)
    const initialAttrs = (options as { attributes?: Record<string, unknown> })?.attributes ?? {};
    const span = makeFakeSpan(name, initialAttrs);
    lastSpan = span;

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return await (fn as any)(span);
    } catch (e) {
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: e instanceof Error ? e.message : String(e),
      });
      throw e;
    } finally {
      span.end();
    }
  });
});

afterEach(() => {
  vi.clearAllMocks();
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('withServiceSpan', () => {
  describe('span creation', () => {
    it('creates a span with the given name', async () => {
      await withServiceSpan('my.service.create', null, () => 'ok');
      expect(lastCallName).toBe('my.service.create');
    });

    it('returns the value produced by fn', async () => {
      const result = await withServiceSpan('op', null, () => 42);
      expect(result).toBe(42);
    });

    it('supports async fn', async () => {
      const result = await withServiceSpan('op', null, async () => {
        await Promise.resolve();
        return 'async-result';
      });
      expect(result).toBe('async-result');
    });

    it('ends the span after fn completes', async () => {
      await withServiceSpan('op', null, () => 'done');
      expect(lastSpan!.ended).toBe(true);
    });
  });

  describe('correlation.id from ctx.correlationId', () => {
    it('injects correlation.id when ctx has correlationId', async () => {
      await withServiceSpan('op', { correlationId: 'req_abc123' }, () => null);
      expect(lastSpan!.attrs['correlation.id']).toBe('req_abc123');
    });

    it('does not inject correlation.id when ctx is null', async () => {
      await withServiceSpan('op', null, () => null);
      expect(lastSpan!.attrs['correlation.id']).toBeUndefined();
    });

    it('does not inject correlation.id when correlationId is undefined', async () => {
      await withServiceSpan('op', {}, () => null);
      expect(lastSpan!.attrs['correlation.id']).toBeUndefined();
    });

    it('does not inject correlation.id when correlationId is null', async () => {
      await withServiceSpan('op', { correlationId: null }, () => null);
      expect(lastSpan!.attrs['correlation.id']).toBeUndefined();
    });

    it('does not inject correlation.id when correlationId is empty string', async () => {
      await withServiceSpan('op', { correlationId: '' }, () => null);
      expect(lastSpan!.attrs['correlation.id']).toBeUndefined();
    });
  });

  describe('custom attributes', () => {
    it('sets provided attributes on the span', async () => {
      await withServiceSpan('op', null, () => null, {
        operation: 'create',
        'workspace.id': 'ws_123',
      });
      expect(lastSpan!.attrs['operation']).toBe('create');
      expect(lastSpan!.attrs['workspace.id']).toBe('ws_123');
    });

    it('merges correlationId with custom attributes', async () => {
      await withServiceSpan('op', { correlationId: 'req_xyz' }, () => null, {
        operation: 'delete',
        'workspace.id': 'ws_456',
      });
      expect(lastSpan!.attrs['correlation.id']).toBe('req_xyz');
      expect(lastSpan!.attrs['operation']).toBe('delete');
      expect(lastSpan!.attrs['workspace.id']).toBe('ws_456');
    });

    it('custom attributes override correlation.id when key conflicts', async () => {
      await withServiceSpan('op', { correlationId: 'req_original' }, () => null, {
        'correlation.id': 'corr_override',
      });
      expect(lastSpan!.attrs['correlation.id']).toBe('corr_override');
    });

    it('works with no attributes argument', async () => {
      await withServiceSpan('op', { correlationId: 'req_minimal' }, () => null);
      expect(lastSpan!.attrs['correlation.id']).toBe('req_minimal');
    });
  });

  describe('span access inside fn', () => {
    it('passes a span object to fn', async () => {
      let receivedSpan: unknown;
      await withServiceSpan('op', null, (span) => { receivedSpan = span; });
      expect(receivedSpan).toBe(lastSpan);
    });

    it('respects attributes set inside fn via span.setAttribute', async () => {
      await withServiceSpan('op', null, (span) => {
        span.setAttribute('dynamic.key', 'dynamic-value');
      });
      expect(lastSpan!.attrs['dynamic.key']).toBe('dynamic-value');
    });
  });

  describe('error handling', () => {
    it('records ERROR status when fn throws', async () => {
      const error = new Error('something went wrong');
      await expect(
        withServiceSpan('op', null, () => { throw error; })
      ).rejects.toThrow('something went wrong');

      expect(lastSpan!.status?.code).toBe(SpanStatusCode.ERROR);
      expect(lastSpan!.status?.message).toBe('something went wrong');
    });

    it('re-throws the original error', async () => {
      const error = new TypeError('invalid type');
      await expect(
        withServiceSpan('op', null, () => Promise.reject(error))
      ).rejects.toBeInstanceOf(TypeError);
    });

    it('ends the span even when fn throws', async () => {
      await expect(
        withServiceSpan('op', null, () => { throw new Error('boom'); })
      ).rejects.toThrow();
      expect(lastSpan!.ended).toBe(true);
    });
  });

  describe('delegates to withSpan from utils/tracing', () => {
    it('calls withSpan once per invocation', async () => {
      await withServiceSpan('my.op', null, () => 'ok');
      expect(tracingModule.withSpan).toHaveBeenCalledOnce();
    });

    it('passes the span name through unchanged', async () => {
      await withServiceSpan('workspace.service.create', null, () => null);
      expect(tracingModule.withSpan).toHaveBeenCalledWith(
        'workspace.service.create',
        expect.any(Function),
        expect.anything(),
      );
    });

    it('passes fn through to withSpan', async () => {
      const fn = vi.fn().mockReturnValue('result');
      const result = await withServiceSpan('op', null, fn);
      expect(fn).toHaveBeenCalledOnce();
      expect(result).toBe('result');
    });
  });
});
