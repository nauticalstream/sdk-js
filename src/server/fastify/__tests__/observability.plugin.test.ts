import { describe, it, expect, vi, afterEach } from 'vitest';
import Fastify, { type FastifyInstance } from 'fastify';
import { fastifyObservability } from '../plugins/observability.plugin';

// ─── OTel metric mocks ───────────────────────────────────────────────────────
// vi.mock factory is hoisted; use vi.hoisted so the refs are initialised before
// the factory runs.

const { mockAdd, mockRecord } = vi.hoisted(() => ({
  mockAdd: vi.fn(),
  mockRecord: vi.fn(),
}));

vi.mock('../observability/metrics', () => ({
  httpRequestsTotal: { add: mockAdd },
  httpRequestDuration: { record: mockRecord },
  httpActiveRequests: { add: mockAdd },
  httpErrorsTotal: { add: mockAdd },
}));

// ─── helpers ─────────────────────────────────────────────────────────────────

let app: FastifyInstance | null = null;

afterEach(async () => {
  vi.clearAllMocks();
  if (app) {
    await app.close();
    app = null;
  }
});

async function buildApp() {
  app = Fastify({ logger: false });
  await app.register(fastifyObservability);

  app.get('/users/:id', async () => ({ ok: true }));
  app.get('/error', async (_, reply) => { reply.code(500).send({ error: 'boom' }); });
  app.get('/notfound', async (_, reply) => { reply.code(404).send({ error: 'not found' }); });

  await app.ready();
  return app;
}

// ─── tests ───────────────────────────────────────────────────────────────────

describe('fastifyObservability plugin', () => {
  describe('active requests counter', () => {
    it('increments httpActiveRequests on request arrival', async () => {
      const server = await buildApp();
      await server.inject({ method: 'GET', url: '/users/123' });

      const addCalls = mockAdd.mock.calls;
      // First call should be +1 with method label
      const increment = addCalls.find(([n, l]) => n === 1 && l?.method === 'GET' && !l?.route);
      expect(increment).toBeDefined();
    });

    it('decrements httpActiveRequests on response', async () => {
      const server = await buildApp();
      await server.inject({ method: 'GET', url: '/users/123' });

      const addCalls = mockAdd.mock.calls;
      const decrement = addCalls.find(([n, l]) => n === -1 && l?.method === 'GET');
      expect(decrement).toBeDefined();
    });
  });

  describe('request totals', () => {
    it('records httpRequestsTotal with route pattern (not dynamic URL)', async () => {
      const server = await buildApp();
      await server.inject({ method: 'GET', url: '/users/abc-123' });

      // Route should be the pattern, not the actual URL
      const totalCall = mockAdd.mock.calls.find(
        ([, labels]) => labels?.route === '/users/:id' && labels?.statusCode === '200'
      );
      expect(totalCall).toBeDefined();
    });

    it('records method and statusCode labels', async () => {
      const server = await buildApp();
      await server.inject({ method: 'GET', url: '/users/42' });

      const totalCall = mockAdd.mock.calls.find(
        ([, labels]) => labels?.method === 'GET' && labels?.statusCode === '200'
      );
      expect(totalCall).toBeDefined();
    });
  });

  describe('request duration', () => {
    it('records httpRequestDuration as a positive number', async () => {
      const server = await buildApp();
      await server.inject({ method: 'GET', url: '/users/1' });

      expect(mockRecord).toHaveBeenCalledOnce();
      const [duration] = mockRecord.mock.calls[0];
      expect(typeof duration).toBe('number');
      expect(duration).toBeGreaterThanOrEqual(0);
    });
  });

  describe('error tracking', () => {
    it('records httpErrorsTotal for 500 responses', async () => {
      const server = await buildApp();
      await server.inject({ method: 'GET', url: '/error' });

      const errorCall = mockAdd.mock.calls.find(
        ([, labels]) => labels?.statusCode === '500'
      );
      expect(errorCall).toBeDefined();
    });

    it('records httpErrorsTotal for 404 responses', async () => {
      const server = await buildApp();
      await server.inject({ method: 'GET', url: '/notfound' });

      const errorCall = mockAdd.mock.calls.find(
        ([, labels]) => labels?.statusCode === '404'
      );
      expect(errorCall).toBeDefined();
    });

    it('does NOT record httpErrorsTotal for 200 responses', async () => {
      const server = await buildApp();
      await server.inject({ method: 'GET', url: '/users/1' });

      // None of the add() calls that have a statusCode label should be '200'
      // for httpErrorsTotal which is identified by the error context
      const errorCounterCalls = mockAdd.mock.calls.filter(
        ([n, labels]) => n === 1 && labels?.statusCode === '200' && labels?.route
      );
      // errorCalls with 200 shouldn't exist — only request totals should
      // This verifies the if(statusCode >= 400) guard
      const allStatuses = mockAdd.mock.calls
        .filter(([, l]) => l?.statusCode)
        .map(([, l]) => l.statusCode);
      expect(allStatuses.filter(s => s === '200').length).toBeGreaterThan(0); // total counter
      expect(errorCounterCalls.length).toBeLessThanOrEqual(1); // only total, not error counter
    });
  });
});
