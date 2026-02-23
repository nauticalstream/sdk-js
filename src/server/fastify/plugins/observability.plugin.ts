import fp from 'fastify-plugin';
import type { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import {
  httpRequestsTotal,
  httpRequestDuration,
  httpActiveRequests,
  httpErrorsTotal,
} from '../observability/metrics';

/**
 * Records OTel metrics for every HTTP request.
 *
 * Instruments:
 *  - `http.active_requests`    — UpDownCounter: +1 on arrive, -1 on response
 *  - `http.requests.total`     — Counter: labelled by method, route, statusCode
 *  - `http.request.duration.ms`— Histogram: ms from onRequest → onResponse
 *  - `http.errors.total`       — Counter: only for 4xx and 5xx responses
 *
 * Route labels use the route pattern (`/users/:id`) rather than the actual URL
 * to prevent metric cardinality explosion from path parameters.
 *
 * If no OTel SDK is registered all instruments are no-ops — this plugin is
 * safe to register unconditionally.
 */
const fastifyObservabilityPlugin: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('onRequest', async (request: FastifyRequest) => {
    httpActiveRequests.add(1, { method: request.method });
    // Store the epoch so we compute wall-clock duration from onRequest rather
    // than relying on reply.elapsedTime which only starts after routing.
    (request as any).__observabilityStartMs = Date.now();
  });

  fastify.addHook('onResponse', async (request: FastifyRequest, reply: FastifyReply) => {
    const route = request.routeOptions?.url ?? 'unknown';
    const labels = {
      method: request.method,
      route,
      statusCode: String(reply.statusCode),
    };

    const startMs = (request as any).__observabilityStartMs as number | undefined;
    const durationMs = startMs !== undefined ? Date.now() - startMs : reply.elapsedTime;

    httpActiveRequests.add(-1, { method: request.method });
    httpRequestsTotal.add(1, labels);
    httpRequestDuration.record(durationMs, labels);

    if (reply.statusCode >= 400) {
      httpErrorsTotal.add(1, labels);
    }
  });
};

export const fastifyObservability = fp(fastifyObservabilityPlugin, {
  name: 'fastify-observability',
  fastify: '5.x',
});
