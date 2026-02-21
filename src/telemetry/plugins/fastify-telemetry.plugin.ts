import type { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import fp from 'fastify-plugin';
import { context } from '@opentelemetry/api';
import {
  setCorrelationId,
  generateCorrelationId,
  getCorrelationId,
} from '../utils/context';

declare module 'fastify' {
  interface FastifyRequest {
    correlationId: string | null;
  }
}

export interface FastifyTelemetryOptions {
  correlationIdHeader?: string;
  generateIfMissing?: boolean;
}

const DEFAULT_OPTIONS: FastifyTelemetryOptions = {
  correlationIdHeader: 'x-correlation-id',
  generateIfMissing: true,
};

/**
 * Fastify plugin for correlation ID extraction and OTel context propagation.
 *
 * Uses onRoute to wrap handlers at registration time — this ensures the handler
 * executes inside the correct OTel context even though Fastify starts handlers
 * in a new async scope after hooks resolve.
 */
const fastifyTelemetryPlugin: FastifyPluginAsync<FastifyTelemetryOptions> = async (
  fastify,
  opts
) => {
  const options = { ...DEFAULT_OPTIONS, ...opts };
  const headerName = options.correlationIdHeader!.toLowerCase();

  fastify.decorateRequest('correlationId', null);

  fastify.addHook('onRequest', async (request: FastifyRequest) => {
    const fromHeader = request.headers[headerName] as string | undefined;
    request.correlationId = fromHeader ?? (options.generateIfMissing ? generateCorrelationId() : null);
  });

  fastify.addHook('onRoute', (routeOptions) => {
    const originalHandler = routeOptions.handler;

    routeOptions.handler = async function wrappedHandler(
      request: FastifyRequest,
      reply: FastifyReply
    ) {
      const correlationId = request.correlationId;

      if (correlationId) {
        const ctx = setCorrelationId(correlationId);
        return context.with(ctx, () => originalHandler.call(this, request, reply));
      }

      return originalHandler.call(this, request, reply);
    };
  });

  fastify.addHook('onSend', async (request: FastifyRequest, reply: FastifyReply) => {
    const correlationId = request.correlationId ?? getCorrelationId();

    if (correlationId && !reply.hasHeader(headerName)) {
      reply.header(headerName, correlationId);
    }
  });
};

export const fastifyTelemetry = fp(fastifyTelemetryPlugin, {
  name: 'fastify-telemetry',
  fastify: '5.x',
});

export default fastifyTelemetry;
