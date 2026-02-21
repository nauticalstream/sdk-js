import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { context } from '@opentelemetry/api';
import { AsyncLocalStorageContextManager } from '@opentelemetry/context-async-hooks';
import { createFastifyServer } from '../factory';
import type { FastifyInstance } from 'fastify';

let app: FastifyInstance | null = null;

beforeEach(() => {
  const manager = new AsyncLocalStorageContextManager();
  manager.enable();
  context.setGlobalContextManager(manager);
});

afterEach(async () => {
  if (app) {
    await app.close();
    app = null;
  }
});

describe('createFastifyServer', () => {
  it('creates a Fastify instance with telemetry plugin', async () => {
    app = await createFastifyServer({ serviceName: 'test' });

    app.get('/test', (request, reply) => {
      // Verify request has correlationId decorator
      expect(request.correlationId).toBeDefined();
      reply.send({ ok: true });
    });

    await app.ready();

    const response = await app.inject({
      method: 'GET',
      url: '/test',
    });

    expect(response.statusCode).toBe(200);
  });

  it('injects correlationId into requests', async () => {
    app = await createFastifyServer({ serviceName: 'test' });

    app.get('/test', (request, reply) => {
      reply.send({ correlationId: request.correlationId });
    });

    await app.ready();

    const response = await app.inject({
      method: 'GET',
      url: '/test',
      headers: {
        'x-correlation-id': 'factory-test-123',
      },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.correlationId).toBe('factory-test-123');
  });

  it('generates correlationId when not provided', async () => {
    app = await createFastifyServer({ serviceName: 'test' });

    app.get('/test', (request, reply) => {
      reply.send({ correlationId: request.correlationId });
    });

    await app.ready();

    const response = await app.inject({
      method: 'GET',
      url: '/test',
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.correlationId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    );
  });

  it('enables request logging when configured', async () => {
    app = await createFastifyServer({
      serviceName: 'test',
      requestLogging: true,
    });

    app.get('/test', (request, reply) => {
      reply.send({ ok: true });
    });

    await app.ready();

    const response = await app.inject({
      method: 'GET',
      url: '/test',
      headers: {
        'x-correlation-id': 'logging-test-456',
      },
    });

    // Request logging is enabled, request should succeed
    expect(response.statusCode).toBe(200);
  });

  it('disables request logging by default', async () => {
    app = await createFastifyServer({ 
      serviceName: 'test',
      requestLogging: false 
    });

    app.get('/test', (request, reply) => {
      reply.send({ ok: true });
    });

    await app.ready();

    const response = await app.inject({
      method: 'GET',
      url: '/test',
    });

    // Request should succeed even without logging
    expect(response.statusCode).toBe(200);
  });

  it('configures CORS when provided', async () => {
    app = await createFastifyServer({
      serviceName: 'test',
      cors: {
        origin: 'https://example.com',
        credentials: true,
      },
    });

    app.get('/test', (request, reply) => {
      reply.send({ ok: true });
    });

    await app.ready();

    const response = await app.inject({
      method: 'OPTIONS',
      url: '/test',
      headers: {
        origin: 'https://example.com',
        'access-control-request-method': 'GET',
      },
    });

    expect(response.headers['access-control-allow-origin']).toBe('https://example.com');
    expect(response.headers['access-control-allow-credentials']).toBe('true');
  });

  it('allows disabling CORS', async () => {
    app = await createFastifyServer({ serviceName: 'test' });

    app.get('/test', (request, reply) => {
      reply.send({ ok: true });
    });

    await app.ready();

    const response = await app.inject({
      method: 'GET',
      url: '/test',
      headers: {
        origin: 'https://example.com',
      },
    });

    expect(response.headers['access-control-allow-origin']).toBeUndefined();
  });
});
