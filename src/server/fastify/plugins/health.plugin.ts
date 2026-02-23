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
    fastify.get(options.path ?? '/health', async (_, reply) => {
      // Run all health checks in parallel
      const checkResults = await Promise.all(
        Object.entries(options.checks).map(async ([name, checkFn]) => {
          try {
            const result = await checkFn();
            if (result === false) {
              return [name, { connected: false, status: 'error' }];
            }
            return [name, { connected: true, status: 'ok' }];
          } catch (error: unknown) {
            // Capture the message whether the check threw an Error or a plain string/value
            const message =
              error instanceof Error
                ? error.message
                : String(error) || 'Health check failed';
            return [
              name,
              {
                connected: false,
                status: 'error',
                error: message,
              },
            ];
          }
        })
      );

      const systems = Object.fromEntries(checkResults);
      const isHealthy = Object.values(systems).every(
        (system: any) => system.connected
      );

      // Return HTTP 503 when degraded so orchestrators (Kubernetes, AWS ALB, nginx)
      // can automatically detect and route around unhealthy instances.
      if (!isHealthy) {
        reply.code(503);
      }

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
