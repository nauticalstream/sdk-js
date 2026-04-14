import { describe, it, expect, beforeAll } from 'vitest';
import { context } from '@opentelemetry/api';
import { AsyncLocalStorageContextManager } from '@opentelemetry/context-async-hooks';
import type { FastifyRequest } from 'fastify';
import {
  createUserContext,
  createSystemContext,
  createContextFromEvent,
} from '../context.js';
import {
  createContext,
  createContextBuilder,
} from '../context/builder.js';
import { setCorrelationId } from '../../../telemetry/utils/context.js';

// Setup OTel context manager
beforeAll(() => {
  const manager = new AsyncLocalStorageContextManager();
  manager.enable();
  context.setGlobalContextManager(manager);
});

// Mock Fastify request
function createMockRequest(headers: Record<string, string> = {}): FastifyRequest {
  return {
    id: 'req-123',
    ip: '127.0.0.1',
    headers: {
      'user-agent': 'test-agent/1.0',
      ...headers,
    },
    correlationId: headers['x-correlation-id'] || null,
  } as any;
}

function encodeUserinfo(userinfo: Record<string, unknown>): string {
  return Buffer.from(JSON.stringify(userinfo), 'utf8').toString('base64');
}

describe('createContext (from Fastify request)', () => {
  it('extracts correlationId from request.correlationId', () => {
    const request = createMockRequest({ 'x-correlation-id': 'test-123' });
    const ctx = createContext(request);

    expect(ctx.correlationId).toBe('test-123');
    expect(ctx.ip).toBe('127.0.0.1');
    expect(ctx.userAgent).toBe('test-agent/1.0');
    expect(ctx.headers).toBeDefined();
    expect(ctx.actionSource).toBe('user');
  });

  it('generates correlationId when not in request', () => {
    const request = createMockRequest();
    const ctx = createContext(request);

    expect(ctx.correlationId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    );
  });

  it('extracts traceId and spanId from OTel context', async () => {
    const request = createMockRequest();
    
    const otelCtx = setCorrelationId('otel-correlation-123');
    
    await context.with(otelCtx, () => {
      const ctx = createContext(request);
      expect(ctx.correlationId).toBeDefined();
    });
  });

  it('extracts userId and workspaceId from headers', () => {
    const request = createMockRequest({
      'x-user-id': 'user-456',
      'x-workspace-id': 'ws-789',
    });

    const ctx = createContext(request);

    expect(ctx.userId).toBe('user-456');
    expect(ctx.user?.sub).toBe('user-456');
    expect(ctx.sub).toBe('user-456');
    expect(ctx.workspaceId).toBe('ws-789');
    expect(ctx.identity?.userId).toBe('user-456');
    expect(ctx.identity?.workspaceId).toBe('ws-789');
    expect(ctx.actorId).toBe('user-456');
    expect(ctx.isUserAction).toBe(true);
    expect(ctx.isSystemAction).toBe(false);
  });

  it('returns undefined for missing business headers', () => {
    const request = createMockRequest();
    const ctx = createContext(request);

    expect(ctx.user).toBeUndefined();
    expect(ctx.userId).toBeUndefined();
    expect(ctx.workspaceId).toBeUndefined();
    expect(ctx.actorId).toBeNull();
    expect(ctx.isUserAction).toBe(false);
    expect(ctx.isSystemAction).toBe(true);
  });

  it('combines base and business context', () => {
    const request = createMockRequest({
      'x-correlation-id': 'universal-123',
      'x-user-id': 'user-999',
      'x-workspace-id': 'ws-888',
    });

    const ctx = createContext(request);

    // Telemetry
    expect(ctx.correlationId).toBe('universal-123');
    expect(ctx.ip).toBe('127.0.0.1');
    expect(ctx.userAgent).toBe('test-agent/1.0');

    // Business
    expect(ctx.user?.sub).toBe('user-999');
    expect(ctx.userId).toBe('user-999');
    expect(ctx.workspaceId).toBe('ws-888');
    
    // Pre-computed audit fields
    expect(ctx.actorId).toBe('user-999');
    expect(ctx.actionSource).toBe('user');
    expect(ctx.isUserAction).toBe(true);
    expect(ctx.isSystemAction).toBe(false);
  });

  it('works with partial business headers', () => {
    const request = createMockRequest({
      'x-user-id': 'user-only',
    });

    const ctx = createContext(request);

    expect(ctx.user?.sub).toBe('user-only');
    expect(ctx.userId).toBe('user-only');
    expect(ctx.workspaceId).toBeUndefined();
    expect(ctx.correlationId).toBeDefined();
  });

  it('falls back to x-userinfo sub when x-user-id is missing', () => {
    const request = createMockRequest({
      'x-userinfo': encodeUserinfo({ sub: 'user-from-userinfo' }),
      'x-workspace-id': 'ws-789',
    });

    const ctx = createContext(request);

    expect(ctx.user?.sub).toBe('user-from-userinfo');
    expect(ctx.userId).toBe('user-from-userinfo');
    expect(ctx.sub).toBe('user-from-userinfo');
    expect(ctx.workspaceId).toBe('ws-789');
    expect(ctx.actorId).toBe('user-from-userinfo');
  });

  it('stores parsed userinfo claims on ctx.user', () => {
    const request = createMockRequest({
      'x-userinfo': encodeUserinfo({
        client_id: 'web-public-staging',
        sub: 'user-from-userinfo',
        ext: { authenticated: true, guest: false },
      }),
    });

    const ctx = createContext(request);

    expect(ctx.user).toEqual({
      client_id: 'web-public-staging',
      sub: 'user-from-userinfo',
      ext: { authenticated: true, guest: false },
    });
    expect(ctx.clientId).toBe('web-public-staging');
    expect(ctx.ext).toEqual({ authenticated: true, guest: false });
    expect(ctx.identity?.clientId).toBe('web-public-staging');
    expect(ctx.identity?.getHeader('x-userinfo')).toBeDefined();
  });

  it('prefers x-user-id over x-userinfo when both are present', () => {
    const request = createMockRequest({
      'x-user-id': 'trusted-user-id',
      'x-userinfo': encodeUserinfo({ client_id: 'web-public-staging', sub: 'userinfo-user-id' }),
    });

    const ctx = createContext(request);

    expect(ctx.user).toEqual({ client_id: 'web-public-staging', sub: 'trusted-user-id' });
    expect(ctx.userId).toBe('trusted-user-id');
    expect(ctx.sub).toBe('trusted-user-id');
  });

  it('exposes propagated token metadata and header accessors', () => {
    const request = createMockRequest({
      authorization: 'Bearer access-token-123',
      'x-workspace-id': 'ws-321',
      'x-userinfo': encodeUserinfo({
        aud: ['graph-api-staging'],
        client_id: 'web-public-staging',
        exp: 1775841893,
        ext: {
          authenticated: false,
          guest: true,
          sub: 'guest:019d7835-e957-7399-a4e8-746138933d4b',
        },
        iat: 1775838293,
        iss: 'https://oauth-staging.nauticalstream.com/',
        jti: '4f49a9b9-066b-4517-9229-b0b5b788c2f4',
        nbf: 1775838293,
        scp: ['openid', 'offline'],
        sub: 'guest:019d7835-e957-7399-a4e8-746138933d4b',
      }),
    });

    const ctx = createContext(request);

    expect(ctx.sub).toBe('guest:019d7835-e957-7399-a4e8-746138933d4b');
    expect(ctx.clientId).toBe('web-public-staging');
    expect(ctx.aud).toEqual(['graph-api-staging']);
    expect(ctx.iss).toBe('https://oauth-staging.nauticalstream.com/');
    expect(ctx.jti).toBe('4f49a9b9-066b-4517-9229-b0b5b788c2f4');
    expect(ctx.scp).toEqual(['openid', 'offline']);
    expect(ctx.ext).toEqual({
      authenticated: false,
      guest: true,
      sub: 'guest:019d7835-e957-7399-a4e8-746138933d4b',
    });
    expect(ctx.identity?.accessToken).toBe('access-token-123');
    expect(ctx.getHeader('authorization')).toBe('Bearer access-token-123');
    expect(ctx.identity?.getHeader('x-workspace-id')).toBe('ws-321');
  });

  it('falls back to bearer JWT claims when x-userinfo is absent', () => {
    const request = createMockRequest({
      authorization:
        'Bearer eyJhbGciOiJSUzI1NiIsImtpZCI6IjMwYTMxNzVlLWI0NGYtNGM1Ni1hMzEzLWJlNDE3Mjk3MjczMCIsInR5cCI6IkpXVCJ9.eyJhdWQiOltdLCJjbGllbnRfaWQiOiJhcGlzaXgtc3RhZ2luZyIsImV4cCI6MTc3NTY5Mjc3NSwiZXh0Ijp7fSwiaWF0IjoxNzc1Njg5MTc1LCJpc3MiOiJodHRwczovL29hdXRoLXN0YWdpbmcu bmF1dGljYWxzdHJlYW0uY29tLyIsImp0aSI6IjcyOWM5NjY3LWUyYmEtNGI0ZC04MDA2LTU0NDQ5YzY1M2Y2ZCIsIm5iZiI6MTc3NTY4OTE3NSwic2NwIjpbXSwic3ViIjoiYXBpc2l4LXN0YWdpbmcifQ.signature'
    });

    const ctx = createContext(request);

    expect(ctx.sub).toBe('apisix-staging');
    expect(ctx.clientId).toBe('apisix-staging');
    expect(ctx.iss).toBe('https://oauth-staging.nauticalstream.com/');
    expect(ctx.scp).toEqual([]);
    expect(ctx.identity?.accessToken).toBeDefined();
  });

  it('ignores malformed x-userinfo values', () => {
    const request = createMockRequest({
      'x-userinfo': 'not-base64-json',
    });

    const ctx = createContext(request);

    expect(ctx.user).toBeUndefined();
    expect(ctx.userId).toBeUndefined();
    expect(ctx.actorId).toBeNull();
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
    expect(ctx.user?.sub).toBe('user-123');
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

    expect(ctx.user?.sub).toBe('user-abc');
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

describe('createUserContext', () => {
  it('creates context with user action source', () => {
    const ctx = createUserContext(
      {
        correlationId: 'test-123',
        ip: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        headers: {},
      },
      'user-456',
      'ws-789'
    );

    expect(ctx.user?.sub).toBe('user-456');
    expect(ctx.userId).toBe('user-456');
    expect(ctx.workspaceId).toBe('ws-789');
    expect(ctx.actorId).toBe('user-456');
    expect(ctx.actionSource).toBe('user');
    expect(ctx.isUserAction).toBe(true);
    expect(ctx.isSystemAction).toBe(false);
  });

  it('handles missing userId', () => {
    const ctx = createUserContext(
      {
        ip: '127.0.0.1',
        headers: {},
      },
      undefined,
      'ws-123'
    );

    expect(ctx.user).toBeUndefined();
    expect(ctx.userId).toBeUndefined();
    expect(ctx.actorId).toBeNull();
    expect(ctx.isUserAction).toBe(false);
    expect(ctx.isSystemAction).toBe(true);
  });
});

describe('createSystemContext', () => {
  it('creates context with system action source', () => {
    const ctx = createSystemContext('ws-123');

    expect(ctx.workspaceId).toBe('ws-123');
    expect(ctx.userId).toBeUndefined();
    expect(ctx.actorId).toBeNull();
    expect(ctx.actionSource).toBe('system');
    expect(ctx.isUserAction).toBe(false);
    expect(ctx.isSystemAction).toBe(true);
  });

  it('allows system action with userId for impersonation', () => {
    const ctx = createSystemContext('ws-123', 'user-456');

    expect(ctx.user?.sub).toBe('user-456');
    expect(ctx.userId).toBe('user-456');
    expect(ctx.actorId).toBe('user-456');
    expect(ctx.actionSource).toBe('system');
    expect(ctx.isUserAction).toBe(false);
    expect(ctx.isSystemAction).toBe(true);
  });
});

describe('createContextFromEvent', () => {
  it('creates context from event envelope', () => {
    const envelope = {
      correlationId: 'event-123',
      source: 'article-service',
      timestamp: '2025-01-01T00:00:00Z',
      subject: 'article.created.v1',
    };

    const ctx = createContextFromEvent(envelope, 'ws-789', 'user-456');

    expect(ctx.correlationId).toBe('event-123');
    expect(ctx.workspaceId).toBe('ws-789');
    expect(ctx.userId).toBe('user-456');
    expect(ctx.actorId).toBe('user-456');
    expect(ctx.actionSource).toBe('system'); // events are system-initiated
    expect(ctx.isUserAction).toBe(false); // events are not direct user actions
    expect(ctx.isSystemAction).toBe(true); // events are system-initiated even with userId
    expect(ctx.eventMetadata?.eventSource).toBe('article-service');
    expect(ctx.eventMetadata?.eventTimestamp).toBe('2025-01-01T00:00:00Z');
    expect(ctx.eventMetadata?.eventType).toBe('article.created.v1');
  });

  it('handles missing userId in event', () => {
    const envelope = {
      correlationId: 'event-456',
      source: 'cron-job',
      timestamp: '2025-01-02T00:00:00Z',
    };

    const ctx = createContextFromEvent(envelope, 'ws-123');

    expect(ctx.userId).toBeUndefined();
    expect(ctx.actorId).toBeNull();
    expect(ctx.actionSource).toBe('system');
    expect(ctx.isSystemAction).toBe(true);
  });
});

