import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  NodeTracerProvider,
  InMemorySpanExporter,
  SimpleSpanProcessor,
} from '@opentelemetry/sdk-trace-node';
import { SpanStatusCode, trace, context } from '@opentelemetry/api';
import { createPublishProperties, withPublishSpan, withMessageSpan } from '../core/telemetry';

// ---------------------------------------------------------------------------
// Setup an in-process tracer so spans are captured without a real collector
// ---------------------------------------------------------------------------

let exporter: InMemorySpanExporter;
let provider: NodeTracerProvider;

beforeEach(() => {
  exporter = new InMemorySpanExporter();
  provider = new NodeTracerProvider({
    spanProcessors: [new SimpleSpanProcessor(exporter)],
  });
  provider.register();
});

afterEach(async () => {
  exporter.reset();
  await provider.shutdown();
  // Restore global no-op provider so other test files are unaffected
  trace.disable();
});

// ---------------------------------------------------------------------------
// Bug 5 fix: withPublishSpan — no setStatus OK, correct span name, messaging.operation
// ---------------------------------------------------------------------------
describe('withPublishSpan', () => {
  it('creates a span named "publish <topic>"', async () => {
    await withPublishSpan('chat/messages', 128, async () => {});
    const [span] = exporter.getFinishedSpans();
    expect(span.name).toBe('publish chat/messages');
  });

  it('sets messaging.system=mqtt and messaging.destination', async () => {
    await withPublishSpan('presence/u1', 64, async () => {});
    const attrs = exporter.getFinishedSpans()[0].attributes;
    expect(attrs['messaging.system']).toBe('mqtt');
    expect(attrs['messaging.destination']).toBe('presence/u1');
  });

  it('sets messaging.operation=publish', async () => {
    await withPublishSpan('chat/messages', 0, async () => {});
    expect(exporter.getFinishedSpans()[0].attributes['messaging.operation']).toBe('publish');
  });

  it('leaves span status UNSET on success (OTel §Span-Status)', async () => {
    await withPublishSpan('chat/messages', 0, async () => {});
    const span = exporter.getFinishedSpans()[0];
    expect(span.status.code).toBe(SpanStatusCode.UNSET);
  });

  it('sets span status ERROR and records exception on failure', async () => {
    const boom = new Error('broker down');
    await withPublishSpan('chat/messages', 0, async () => { throw boom; }).catch(() => {});
    const span = exporter.getFinishedSpans()[0];
    expect(span.status.code).toBe(SpanStatusCode.ERROR);
    expect(span.events.some(e => e.name === 'exception')).toBe(true);
  });

  it('rethrows errors', async () => {
    await expect(
      withPublishSpan('x', 0, async () => { throw new Error('fail'); })
    ).rejects.toThrow('fail');
  });
});

// ---------------------------------------------------------------------------
// Bug 5 + 6 fix: withMessageSpan — span name "process", messaging.operation=process, no setStatus OK
// ---------------------------------------------------------------------------
describe('withMessageSpan', () => {
  it('creates a span named "process <topic>"', async () => {
    await withMessageSpan('notification/u1', undefined, async () => {});
    expect(exporter.getFinishedSpans()[0].name).toBe('process notification/u1');
  });

  it('sets messaging.operation=process', async () => {
    await withMessageSpan('notification/u1', undefined, async () => {});
    expect(exporter.getFinishedSpans()[0].attributes['messaging.operation']).toBe('process');
  });

  it('leaves span status UNSET on success', async () => {
    await withMessageSpan('chat/messages', undefined, async () => {});
    expect(exporter.getFinishedSpans()[0].status.code).toBe(SpanStatusCode.UNSET);
  });

  it('sets span status ERROR on failure', async () => {
    await withMessageSpan('x', undefined, async () => { throw new Error('oops'); }).catch(() => {});
    expect(exporter.getFinishedSpans()[0].status.code).toBe(SpanStatusCode.ERROR);
  });

  it('extracts parent trace context from userProperties', async () => {
    // Register the W3C propagator so inject/extract work as they do in production
    const { propagation: propagationApi } = await import('@opentelemetry/api');
    const { W3CTraceContextPropagator } = await import('@opentelemetry/core');
    const origPropagator = (propagationApi as any)._getGlobalPropagator?.();
    propagationApi.setGlobalPropagator(new W3CTraceContextPropagator());

    const tracer = trace.getTracer('test');
    const parentSpan = tracer.startSpan('parent');
    const carrier: Record<string, string> = {};
    propagationApi.inject(
      trace.setSpan(context.active(), parentSpan),
      carrier,
      { set: (c: Record<string, string>, k: string, v: string) => { c[k] = v; } }
    );
    parentSpan.end();
    exporter.reset();

    // withMessageSpan should create a child of that parent
    await withMessageSpan('chat/messages', carrier, async () => {});
    const childSpan = exporter.getFinishedSpans()[0];
    const parentCtx = parentSpan.spanContext();
    expect(childSpan.parentSpanContext?.spanId).toBe(parentCtx.spanId);

    // Restore (prevent polluting other tests)
    if (origPropagator) propagationApi.setGlobalPropagator(origPropagator);
  });
});

// ---------------------------------------------------------------------------
// createPublishProperties always injects correlation ID and timestamp
// ---------------------------------------------------------------------------
describe('createPublishProperties', () => {
  it('includes x-correlation-id', () => {
    const props = createPublishProperties('corr-123');
    expect(props['x-correlation-id']).toBe('corr-123');
  });

  it('includes x-timestamp', () => {
    const props = createPublishProperties('corr-123');
    expect(props['x-timestamp']).toBeTruthy();
    expect(() => new Date(props['x-timestamp']!)).not.toThrow();
  });

  it('includes x-source when provided', () => {
    const props = createPublishProperties('corr-123', 'my-service');
    expect(props['x-source']).toBe('my-service');
  });

  it('omits x-source when not provided', () => {
    expect(createPublishProperties('corr-123')['x-source']).toBeUndefined();
  });
});
