import type { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import fp from 'fastify-plugin';
import { context } from '@opentelemetry/api';
import {
  setCorrelationId,
  generateCorrelationId,
  getCorrelationId,
} from '../../../telemetry/utils/context';

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
 * Extracts/generates a correlation ID per request and propagates it through OTel context.
 * Uses `onRoute` to wrap handlers at registration time, ensuring the handler runs
 * inside the correct async context even after Fastify starts a new async scope.
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
