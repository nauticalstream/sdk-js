import fastify, { type FastifyInstance } from 'fastify';
import { createLogger } from '../../telemetry/utils/logging';
import { createFastifyLoggerAdapter } from './logger/adapter';
import { fastifyTelemetry } from './plugins/telemetry.plugin';
import { fastifyRequestLogging } from './plugins/logging.plugin';
import { fastifyObservability } from './plugins/observability.plugin';
import { fastifyCors } from './plugins/cors.plugin';
import { DEFAULT_SERVICE_NAME, DEFAULT_REQUEST_LOGGING } from './config';
import type { FastifyServerOptions } from './types';

/**
 * Creates a Fastify server with automatic telemetry integration.
 *
 * Registers in order:
 *  1. `fastifyTelemetry`      — correlation ID extraction + OTel context propagation
 *  2. `fastifyObservability`  — OTel metrics per request (no-op when SDK absent)
 *  3. `fastifyRequestLogging` — structured Pino request/response logs (if enabled)
 *  4. `fastifyCors`           — CORS headers (if configured)
 *
 * @example
 * ```typescript
 * const server = await createFastifyServer({
 *   serviceName: 'my-service',
 *   trustProxy: true,   // required behind AWS ALB / nginx / k8s ingress
 *   cors: { origin: true },
 * });
 * ```
 */
export async function createFastifyServer(
  options: FastifyServerOptions
): Promise<FastifyInstance> {
  const {
    serviceName = DEFAULT_SERVICE_NAME,
    requestLogging = DEFAULT_REQUEST_LOGGING,
    cors,
    destination,
    trustProxy = false,
  } = options;

  const server = fastify({
    loggerInstance: createFastifyLoggerAdapter(createLogger({ name: serviceName }, destination)),
    disableRequestLogging: true,
    trustProxy,
  });

  await server.register(fastifyTelemetry);
  await server.register(fastifyObservability);
  if (requestLogging) await server.register(fastifyRequestLogging);
  if (cors) await server.register(fastifyCors, { cors });

  return server;
}
