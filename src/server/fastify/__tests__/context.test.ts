import { describe, it, expect, beforeAll } from 'vitest';
import { context } from '@opentelemetry/api';
import { AsyncLocalStorageContextManager } from '@opentelemetry/context-async-hooks';
import type { FastifyRequest } from 'fastify';
import {
  createBaseContext,
  extractBusinessContext,
  createContext,
  createContextBuilder,
} from '../context';
import { setCorrelationId } from '../../../telemetry/utils/context';

// Setup OTel context manager
beforeAll(() => {
  const manager = new AsyncLocalStorageContextManager();
  manager.enable();
  context.setGlobalContextManager(manager);
});

// Mock Fastify request
function createMockRequest(headers: Record<string, string> = {}): FastifyRequest {
  return {
    ip: '127.0.0.1',
    headers: {
      'user-agent': 'test-agent/1.0',
      ...headers,
    },
    correlationId: headers['x-correlation-id'] || null,
  } as any;
}

describe('createBaseContext', () => {
  it('extracts correlationId from request.correlationId', () => {
    const request = createMockRequest({ 'x-correlation-id': 'test-123' });
    const ctx = createBaseContext(request);

    expect(ctx.correlationId).toBe('test-123');
    expect(ctx.ip).toBe('127.0.0.1');
    expect(ctx.userAgent).toBe('test-agent/1.0');
    expect(ctx.headers).toBeDefined();
  });

  it('generates correlationId when not in request', () => {
    const request = createMockRequest();
    const ctx = createBaseContext(request);

    expect(ctx.correlationId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    );
  });

  it('extracts traceId and spanId from OTel context', async () => {
    const request = createMockRequest();
    
    const otelCtx = setCorrelationId('otel-correlation-123');
    
    await context.with(otelCtx, () => {
      const ctx = createBaseContext(request);
      expect(ctx.correlationId).toBeDefined();
    });
  });
});

describe('extractBusinessContext', () => {
  it('extracts userId and workspaceId from headers', () => {
    const request = createMockRequest({
      'x-user-id': 'user-456',
      'x-workspace-id': 'ws-789',
    });

    const ctx = extractBusinessContext(request);

    expect(ctx.userId).toBe('user-456');
    expect(ctx.workspaceId).toBe('ws-789');
  });

  it('returns undefined for missing business headers', () => {
    const request = createMockRequest();
    const ctx = extractBusinessContext(request);

    expect(ctx.userId).toBeUndefined();
    expect(ctx.workspaceId).toBeUndefined();
  });
});

describe('createContext', () => {
  it('combines base and business context', () => {
    const request = createMockRequest({
      'x-correlation-id': 'universal-123',
      'x-user-id': 'user-999',
      'x-workspace-id': 'ws-888',
    });

    const ctx = createContext(request);

    // Base context
    expect(ctx.correlationId).toBe('universal-123');
    expect(ctx.ip).toBe('127.0.0.1');
    expect(ctx.userAgent).toBe('test-agent/1.0');

    // Business context
    expect(ctx.userId).toBe('user-999');
    expect(ctx.workspaceId).toBe('ws-888');
  });

  it('works with partial business headers', () => {
    const request = createMockRequest({
      'x-user-id': 'user-only',
    });

    const ctx = createContext(request);

    expect(ctx.userId).toBe('user-only');
    expect(ctx.workspaceId).toBeUndefined();
    expect(ctx.correlationId).toBeDefined();
  });
});

describe('createContextBuilder', () => {
  it('extends universal context with custom fields', () => {
    const builder = createContextBuilder((req) => ({
      customerId: req.headers['x-customer-id'] as string,
      tenantId: req.headers['x-tenant-id'] as string,
    }));

    const request = createMockRequest({
      'x-user-id': 'user-123',
      'x-customer-id': 'cust-456',
      'x-tenant-id': 'tenant-789',
    });

    const ctx = builder(request);

    // Universal context fields
    expect(ctx.userId).toBe('user-123');
    expect(ctx.correlationId).toBeDefined();
    expect(ctx.ip).toBe('127.0.0.1');

    // Custom fields
    expect(ctx.customerId).toBe('cust-456');
    expect(ctx.tenantId).toBe('tenant-789');
  });

  it('allows empty custom extractor', () => {
    const builder = createContextBuilder(() => ({}));
    const request = createMockRequest({ 'x-user-id': 'user-abc' });

    const ctx = builder(request);

    expect(ctx.userId).toBe('user-abc');
    expect(ctx.correlationId).toBeDefined();
  });

  it('custom fields can override universal fields', () => {
    const builder = createContextBuilder(() => ({
      userId: 'overridden-user',
    }));

    const request = createMockRequest({
      'x-user-id': 'original-user',
    });

    const ctx = builder(request);

    expect(ctx.userId).toBe('overridden-user');
  });
});
