import fp from 'fastify-plugin';
import type { FastifyInstance } from 'fastify';
import type { HealthPluginOptions } from '../types';

/**
 * Creates a health check endpoint that runs all checks and returns aggregated status.
 *
 * @example
 * await server.register(createHealthPlugin({
 *   serviceName: 'workspace-service',
 *   version: '1.0.0',
 *   checks: {
 *     database: async () => { await prisma.$queryRaw`SELECT 1`; return true; },
 *     nats: () => eventBus.isConnected(),
 *   },
 * }));
 */
export function createHealthPlugin(options: HealthPluginOptions) {
  async function healthPlugin(fastify: FastifyInstance): Promise<void> {
    fastify.get(options.path ?? '/health', async () => {
      // Run all health checks in parallel
      const checkResults = await Promise.all(
        Object.entries(options.checks).map(async ([name, checkFn]) => {
          try {
            const result = await checkFn();
            if (result === false) {
              return [name, { connected: false, status: 'error' }];
            }
            return [name, { connected: true, status: 'ok' }];
          } catch (error: any) {
            return [
              name,
              {
                connected: false,
                status: 'error',
                error: error?.message || 'Health check failed',
              },
            ];
          }
        })
      );

      const systems = Object.fromEntries(checkResults);
      const isHealthy = Object.values(systems).every(
        (system: any) => system.connected
      );

      return {
        status: isHealthy ? 'ok' : 'degraded',
        service: options.serviceName,
        version: options.version,
        timestamp: new Date().toISOString(),
        systems,
      };
    });
  }

  return fp(healthPlugin, {
    name: 'fastify-health',
    fastify: '5.x',
  });
}
