import { describe, it, expect, afterEach } from 'vitest';
import Fastify, { type FastifyInstance } from 'fastify';
import { createHealthPlugin } from '../plugins/health.plugin';

let app: FastifyInstance | null = null;

afterEach(async () => {
  if (app) {
    await app.close();
    app = null;
  }
});

describe('createHealthPlugin', () => {
  it('registers /health endpoint', async () => {
    app = Fastify({ logger: false });
   await app.register(createHealthPlugin({
      serviceName: 'test-service',
      version: '1.0.0',
      checks: {},
    }));
    await app.ready();

    const response = await app.inject({
      method: 'GET',
      url: '/health',
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.status).toBe('ok');
    expect(body.service).toBe('test-service');
    expect(body.version).toBe('1.0.0');
    expect(body.timestamp).toBeDefined();
  });

  it('runs custom health checks', async () => {
    app = Fastify({ logger: false });

    let checkCalled = false;

    await app.register(
      createHealthPlugin({
        serviceName: 'test-service',
        version: '1.0.0',
        checks: {
          database: async () => {
            checkCalled = true;
            return true;
          },
        },
      })
    );

    await app.ready();

    const response = await app.inject({
      method: 'GET',
      url: '/health',
    });

    expect(response.statusCode).toBe(200);
    expect(checkCalled).toBe(true);

    const body = JSON.parse(response.body);
    expect(body.systems.database.status).toBe('ok');
    expect(body.systems.database.connected).toBe(true);
  });

  it('returns degraded status when checks fail', async () => {
    app = Fastify({ logger: false });

    await app.register(
      createHealthPlugin({
        serviceName: 'test-service',
        version: '1.0.0',
        checks: {
          database: async () => {
            throw new Error('Connection failed');
          },
          cache: async () => {
            return true;
          },
        },
      })
    );

    await app.ready();

    const response = await app.inject({
      method: 'GET',
      url: '/health',
    });

    expect(response.statusCode).toBe(200);

    const body = JSON.parse(response.body);
    expect(body.status).toBe('degraded');
    expect(body.systems.database.status).toBe('error');
    expect(body.systems.database.connected).toBe(false);
    expect(body.systems.database.error).toBe('Connection failed');
    expect(body.systems.cache.status).toBe('ok');
    expect(body.systems.cache.connected).toBe(true);
  });

  it('handles all checks failing', async () => {
    app = Fastify({ logger: false });

    await app.register(
      createHealthPlugin({
        serviceName: 'test-service',
        version: '1.0.0',
        checks: {
          service1: async () => {
            throw new Error('Service 1 down');
          },
          service2: async () => {
            throw new Error('Service 2 down');
          },
        },
      })
    );

    await app.ready();

    const response = await app.inject({
      method: 'GET',
      url: '/health',
    });

    expect(response.statusCode).toBe(200);

    const body = JSON.parse(response.body);
    expect(body.status).toBe('degraded');
    expect(body.systems.service1.connected).toBe(false);
    expect(body.systems.service2.connected).toBe(false);
  });

  it('works with custom path', async () => {
    app = Fastify({ logger: false });

    await app.register(
      createHealthPlugin({
        serviceName: 'test-service',
        version: '1.0.0',
        checks: {},
        path: '/custom-health',
      })
    );

    await app.ready();

    const response = await app.inject({
      method: 'GET',
      url: '/custom-health',
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.status).toBe('ok');
  });

  it('handles synchronous checks', async () => {
    app = Fastify({ logger: false });

    await app.register(
      createHealthPlugin({
        serviceName: 'test-service',
        version: '1.0.0',
        checks: {
          memory: () => {
            const usage = process.memoryUsage();
            return usage.heapUsed < usage.heapTotal * 0.9;
          },
        },
      })
    );

    await app.ready();

    const response = await app.inject({
      method: 'GET',
      url: '/health',
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.systems.memory).toBeDefined();
  });

  it('includes timestamp in response', async () => {
    app = Fastify({ logger: false });
    await app.register(createHealthPlugin({
      serviceName: 'test-service',
      version: '1.0.0',
      checks: {},
    }));
    await app.ready();

    const before = new Date().toISOString();

    const response = await app.inject({
      method: 'GET',
      url: '/health',
    });

    const after = new Date().toISOString();

    const body = JSON.parse(response.body);
    expect(body.timestamp).toBeDefined();
    expect(body.timestamp >= before).toBe(true);
    expect(body.timestamp <= after).toBe(true);
  });

  it('handles check returning false', async () => {
    app = Fastify({ logger: false });

    await app.register(
      createHealthPlugin({
        serviceName: 'test-service',
        version: '1.0.0',
        checks: {
          customCheck: async () => false,
        },
      })
    );

    await app.ready();

    const response = await app.inject({
      method: 'GET',
      url: '/health',
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.status).toBe('degraded');
    expect(body.systems.customCheck.connected).toBe(false);
    expect(body.systems.customCheck.status).toBe('error');
  });
});
