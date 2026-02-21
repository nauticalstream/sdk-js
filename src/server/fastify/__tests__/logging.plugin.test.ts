import { describe, it, expect, beforeAll } from 'vitest';
import { Writable } from 'node:stream';
import type { FastifyInstance } from 'fastify';
import { context } from '@opentelemetry/api';
import { AsyncLocalStorageContextManager } from '@opentelemetry/context-async-hooks';
import { createFastifyServer } from '../factory';

beforeAll(() => {
  const manager = new AsyncLocalStorageContextManager();
  manager.enable();
  context.setGlobalContextManager(manager);
});

interface LogEntry {
  msg: string;
  correlationId?: string;
  req?: object;
  res?: object;
  responseTime?: number;
  [key: string]: unknown;
}

/** Build a real server via the factory with log output captured into an array. */
async function buildApp(): Promise<{ app: FastifyInstance; logs: LogEntry[] }> {
  const logs: LogEntry[] = [];

  const destination = new Writable({
    write(chunk: Buffer, _encoding, callback) {
      try {
        const entry = JSON.parse(chunk.toString().trim()) as LogEntry;
        logs.push(entry);
      } catch {
        // ignore non-JSON lines (e.g. empty lines)
      }
      callback();
    },
  });

  const app = await createFastifyServer({
    serviceName: 'test',
    requestLogging: true,
    destination,
  });

  app.get('/test', async () => ({ ok: true }));

  await app.ready();
  return { app, logs };
}


/** Wait one event-loop tick so Pino's internal stream flush has a chance to run */
const flushLogs = () => new Promise<void>((resolve) => setImmediate(resolve));

describe('fastifyRequestLogging plugin', () => {
  describe('incoming request log', () => {
    it('logs "incoming request" with the correct correlationId from header', async () => {
      const { app, logs } = await buildApp();

      await app.inject({
        method: 'GET',
        url: '/test',
        headers: { 'x-correlation-id': 'my-trace-id-111' },
      });
      await flushLogs();

      const entry = logs.find((l) => l.msg === 'incoming request');
      expect(entry).toBeDefined();
      expect(entry!.correlationId).toBe('my-trace-id-111');

      await app.close();
    });

    it('logs "incoming request" with a generated UUID when no header is provided', async () => {
      const { app, logs } = await buildApp();

      await app.inject({ method: 'GET', url: '/test' });
      await flushLogs();

      const entry = logs.find((l) => l.msg === 'incoming request');
      expect(entry).toBeDefined();
      expect(entry!.correlationId).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      );

      await app.close();
    });

    it('includes req object in incoming request log', async () => {
      const { app, logs } = await buildApp();

      await app.inject({ method: 'GET', url: '/test' });
      await flushLogs();

      const entry = logs.find((l) => l.msg === 'incoming request');
      expect(entry?.req).toBeDefined();

      await app.close();
    });
  });

  describe('request completed log', () => {
    it('logs "request completed" with the same correlationId as incoming request', async () => {
      const { app, logs } = await buildApp();

      await app.inject({
        method: 'GET',
        url: '/test',
        headers: { 'x-correlation-id': 'trace-consistency-abc' },
      });
      await flushLogs();

      const incoming = logs.find((l) => l.msg === 'incoming request');
      const completed = logs.find((l) => l.msg === 'request completed');

      expect(incoming!.correlationId).toBe('trace-consistency-abc');
      expect(completed!.correlationId).toBe('trace-consistency-abc');

      await app.close();
    });

    it('incoming and completed logs share the same generated ID when no header given', async () => {
      const { app, logs } = await buildApp();

      await app.inject({ method: 'GET', url: '/test' });
      await flushLogs();

      const incoming = logs.find((l) => l.msg === 'incoming request');
      const completed = logs.find((l) => l.msg === 'request completed');

      expect(incoming!.correlationId).toBeDefined();
      expect(incoming!.correlationId).toBe(completed!.correlationId);

      await app.close();
    });

    it('includes res and responseTime in completed log', async () => {
      const { app, logs } = await buildApp();

      await app.inject({ method: 'GET', url: '/test' });
      await flushLogs();

      const entry = logs.find((l) => l.msg === 'request completed');
      expect(entry?.res).toBeDefined();
      expect(typeof entry?.responseTime).toBe('number');

      await app.close();
    });
  });

  describe('log ordering', () => {
    it('"incoming request" is logged before "request completed"', async () => {
      const { app, logs } = await buildApp();

      await app.inject({ method: 'GET', url: '/test' });
      await flushLogs();

      const incomingIdx = logs.findIndex((l) => l.msg === 'incoming request');
      const completedIdx = logs.findIndex((l) => l.msg === 'request completed');

      expect(incomingIdx).toBeGreaterThanOrEqual(0);
      expect(completedIdx).toBeGreaterThan(incomingIdx);

      await app.close();
    });
  });

  describe('correlation ID isolation between requests', () => {
    it('two concurrent requests use different correlationIds in their logs', async () => {
      const { app, logs } = await buildApp();

      await Promise.all([
        app.inject({ method: 'GET', url: '/test' }),
        app.inject({ method: 'GET', url: '/test' }),
      ]);
      await flushLogs();

      const ids = logs
        .filter((l) => l.msg === 'incoming request')
        .map((l) => l.correlationId);

      expect(ids).toHaveLength(2);
      expect(ids[0]).not.toBe(ids[1]);

      await app.close();
    });

    it('explicitly passed IDs are isolated per request', async () => {
      const { app, logs } = await buildApp();

      await Promise.all([
        app.inject({ method: 'GET', url: '/test', headers: { 'x-correlation-id': 'req-aaa' } }),
        app.inject({ method: 'GET', url: '/test', headers: { 'x-correlation-id': 'req-bbb' } }),
      ]);
      await flushLogs();

      const incoming = logs.filter((l) => l.msg === 'incoming request');
      const completed = logs.filter((l) => l.msg === 'request completed');

      const incomingIds = new Set(incoming.map((l) => l.correlationId));
      expect(incomingIds.has('req-aaa')).toBe(true);
      expect(incomingIds.has('req-bbb')).toBe(true);

      // Each completed log must carry one of the expected IDs
      for (const c of completed) {
        expect(['req-aaa', 'req-bbb']).toContain(c.correlationId);
      }

      await app.close();
    });
  });
});

