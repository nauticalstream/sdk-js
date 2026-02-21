import { describe, it, expect, beforeAll } from 'vitest';
import Fastify, { type FastifyInstance } from 'fastify';
import { context } from '@opentelemetry/api';
import { AsyncLocalStorageContextManager } from '@opentelemetry/context-async-hooks';
import { fastifyTelemetry } from '../plugins/telemetry.plugin';
import { getCorrelationId } from '../../../telemetry/utils/context';

// Register a real async context manager so OTel context.with() propagates
// through await boundaries — same setup as context.test.ts
beforeAll(() => {
  const manager = new AsyncLocalStorageContextManager();
  manager.enable();
  context.setGlobalContextManager(manager);
});

async function buildApp(opts: { generateIfMissing?: boolean } = {}): Promise<FastifyInstance> {
  const app = Fastify({ logger: false });

  await app.register(fastifyTelemetry, {
    correlationIdHeader: 'x-correlation-id',
    generateIfMissing: opts.generateIfMissing ?? true,
  });

  // Simulates a route that delegates to a deep service function.
  // The service function doesn't receive the request — it reads correlation ID
  // purely from OTel context. This is the critical propagation test.
  app.get('/deep', async () => {
    // Simulated deep service call — no access to `request`
    const idFromContext = await deepServiceCall();
    return { correlationId: idFromContext };
  });

  app.get('/direct', async (request) => {
    return { correlationId: request.correlationId };
  });

  await app.ready();
  return app;
}

/** Simulates a service function that has no access to the Fastify request */
async function deepServiceCall(): Promise<string> {
  // Simulate async work (e.g. DB query)
  await Promise.resolve();
  return getCorrelationId();
}

describe('fastifyTelemetry plugin — correlation ID propagation', () => {
  describe('with generateIfMissing: true (default)', () => {
    it('propagates the incoming header ID into deep service code via OTel context', async () => {
      const app = await buildApp();
      const incomingId = 'frontend-generated-id-abc123';

      const res = await app.inject({
        method: 'GET',
        url: '/deep',
        headers: { 'x-correlation-id': incomingId },
      });

      expect(res.statusCode).toBe(200);
      expect(JSON.parse(res.body).correlationId).toBe(incomingId);
      await app.close();
    });

    it('generates a UUID correlation ID when none is provided and propagates it', async () => {
      const app = await buildApp();

      const res = await app.inject({ method: 'GET', url: '/deep' });

      const { correlationId } = JSON.parse(res.body);
      expect(correlationId).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      );
      await app.close();
    });

    it('each request gets its own isolated correlation ID', async () => {
      const app = await buildApp();

      const [res1, res2] = await Promise.all([
        app.inject({ method: 'GET', url: '/deep' }),
        app.inject({ method: 'GET', url: '/deep' }),
      ]);

      const id1 = JSON.parse(res1.body).correlationId;
      const id2 = JSON.parse(res2.body).correlationId;
      expect(id1).not.toBe(id2);
      await app.close();
    });

    it('echoes the correlation ID in the response header', async () => {
      const app = await buildApp();
      const incomingId = 'echo-test-id';

      const res = await app.inject({
        method: 'GET',
        url: '/deep',
        headers: { 'x-correlation-id': incomingId },
      });

      expect(res.headers['x-correlation-id']).toBe(incomingId);
      await app.close();
    });

    it('generates and echoes a UUID in the response header when none is provided', async () => {
      const app = await buildApp();

      const res = await app.inject({ method: 'GET', url: '/deep' });

      expect(res.headers['x-correlation-id']).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      );
      await app.close();
    });

    it('response header ID matches what deep service code saw', async () => {
      const app = await buildApp();

      const res = await app.inject({ method: 'GET', url: '/deep' });

      const bodyId = JSON.parse(res.body).correlationId;
      const headerId = res.headers['x-correlation-id'];
      expect(bodyId).toBe(headerId);
      await app.close();
    });

    it('request.correlationId decorator matches OTel context value', async () => {
      const app = await buildApp();
      const incomingId = 'decorator-vs-context';

      const res = await app.inject({
        method: 'GET',
        url: '/direct',
        headers: { 'x-correlation-id': incomingId },
      });

      expect(JSON.parse(res.body).correlationId).toBe(incomingId);
      await app.close();
    });
  });

  describe('with generateIfMissing: false', () => {
    it('does not generate a correlation ID when none is provided', async () => {
      const app = await buildApp({ generateIfMissing: false });

      const res = await app.inject({ method: 'GET', url: '/direct' });

      // request.correlationId should be null (decorateRequest initialises as null)
      const { correlationId } = JSON.parse(res.body);
      expect(correlationId).toBeNull();
      await app.close();
    });

    it('still propagates a provided correlation ID', async () => {
      const app = await buildApp({ generateIfMissing: false });
      const incomingId = 'provided-id-no-generate';

      const res = await app.inject({
        method: 'GET',
        url: '/deep',
        headers: { 'x-correlation-id': incomingId },
      });

      expect(JSON.parse(res.body).correlationId).toBe(incomingId);
      await app.close();
    });
  });
});
