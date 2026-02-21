import fastify, { type FastifyInstance, type FastifyBaseLogger } from 'fastify';
import type { Bindings, ChildLoggerOptions } from 'pino';
import { createLogger } from '../../telemetry/utils/logging';
import { fastifyTelemetry } from './plugins/telemetry.plugin';
import { fastifyRequestLogging } from './plugins/logging.plugin';
import type { FastifyServerOptions } from './types';

/** Adapts telemetry logger (Pino) to Fastify's logger interface */
function createFastifyLoggerAdapter(logger: ReturnType<typeof createLogger>): FastifyBaseLogger {
  return {
    level: logger.level,
    fatal: logger.fatal.bind(logger),
    error: logger.error.bind(logger),
    warn: logger.warn.bind(logger),
    info: logger.info.bind(logger),
    debug: logger.debug.bind(logger),
    trace: logger.trace.bind(logger),
    silent: logger.silent?.bind(logger) || (() => {}),
    child(bindings: Bindings, options?: ChildLoggerOptions): FastifyBaseLogger {
      const childLogger = logger.child(bindings, options);
      return createFastifyLoggerAdapter(childLogger);
    },
  } as FastifyBaseLogger;
}

/**
 * Creates a Fastify server with automatic telemetry integration.
 * 
 * @param options - Server configuration
 * @returns Configured Fastify instance
 * 
 * @example
 * const server = await createFastifyServer({
 *   serviceName: 'my-service',
 *   requestLogging: true,
 *   cors: { origin: true }
 * });
 */
export async function createFastifyServer(
  options: FastifyServerOptions
): Promise<FastifyInstance> {
  const { serviceName = 'fastify', requestLogging = true, cors, destination, ...fastifyOptions } = options;
  
  const telemetryLogger = createLogger({ name: serviceName }, destination);
  const logger = createFastifyLoggerAdapter(telemetryLogger);
  
  const server = fastify({
    ...fastifyOptions,
    loggerInstance: logger,
    disableRequestLogging: true,
  });

  await server.register(fastifyTelemetry);

  if (requestLogging) {
    await server.register(fastifyRequestLogging);
  }

  if (cors) {
    const fastifyCors = await import('@fastify/cors');
    const corsOptions = typeof cors === 'boolean' ? { origin: true } : cors;
    await server.register(fastifyCors.default, corsOptions);
  }

  return server;
}
