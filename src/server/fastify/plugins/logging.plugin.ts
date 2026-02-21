import type { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import fp from 'fastify-plugin';
import { context } from '@opentelemetry/api';
import { setCorrelationId } from '../../../telemetry/utils/context';

/** Logs requests/responses with the correct correlationId in the Pino mixin. */
const fastifyRequestLoggingPlugin: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('onRequest', async (request: FastifyRequest) => {
    const correlationId = request.correlationId;

    if (correlationId) {
      context.with(setCorrelationId(correlationId), () => {
        request.log.info({ req: request }, 'incoming request');
      });
    } else {
      request.log.info({ req: request }, 'incoming request');
    }
  });

  fastify.addHook('onResponse', async (request: FastifyRequest, reply: FastifyReply) => {
    const correlationId = request.correlationId;

    if (correlationId) {
      context.with(setCorrelationId(correlationId), () => {
        request.log.info(
          { res: reply, responseTime: reply.elapsedTime },
          'request completed'
        );
      });
    } else {
      request.log.info({ res: reply, responseTime: reply.elapsedTime }, 'request completed');
    }
  });
};

export const fastifyRequestLogging = fp(fastifyRequestLoggingPlugin, {
  name: 'fastify-request-logging',
  fastify: '5.x',
});
