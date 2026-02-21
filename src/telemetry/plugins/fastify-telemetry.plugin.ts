import type { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import { context } from '@opentelemetry/api';
import {
  setCorrelationId,
  generateCorrelationId,
  getCorrelationId,
} from '../utils/context';

export interface FastifyTelemetryOptions {
  correlationIdHeader?: string;
  generateIfMissing?: boolean;
}

const DEFAULT_OPTIONS: FastifyTelemetryOptions = {
  correlationIdHeader: 'x-correlation-id',
  generateIfMissing: true,
};

/**
 * Fastify plugin for correlation ID extraction and propagation
 * OTel v2 optimized: Properly handles context lifecycle across async request handlers
 */
export const fastifyTelemetry: FastifyPluginAsync<FastifyTelemetryOptions> = async (
  fastify,
  opts
) => {
  const options = { ...DEFAULT_OPTIONS, ...opts };
  const headerName = options.correlationIdHeader!.toLowerCase();

  /**
   * onRequest hook: Extract and set correlation ID
   * This runs at the beginning of request processing
   */
  fastify.addHook('onRequest', async (request: FastifyRequest) => {
    // Extract correlation ID from incoming request headers
    let correlationId = request.headers[headerName] as string | undefined;

    // Generate new one if missing and configured to do so
    if (!correlationId && options.generateIfMissing) {
      correlationId = generateCorrelationId();
    }

    // Store correlation ID on request object for access throughout lifecycle
    (request as any).correlationId = correlationId;

    // Set in OpenTelemetry context for this request's async context
    // OTel v2 automatically maintains async context through the request
    if (correlationId) {
      const ctx = setCorrelationId(correlationId);
      // Execute the rest of the request within this context
      await context.with(ctx, async () => {
        // Handler execution continues in this context
        return Promise.resolve();
      });
    }
  });

  /**
   * onSend hook: Add correlation ID to response headers
   * This runs when the response is being sent
   */
  fastify.addHook('onSend', async (request: FastifyRequest, reply: FastifyReply) => {
    // Get correlation ID from request (set in onRequest)
    const correlationId = (request as any).correlationId || getCorrelationId();
    
    // Add to response headers if not already present
    if (correlationId && !reply.hasHeader(headerName)) {
      reply.header(headerName, correlationId);
    }
  });

  /**
   * Decorate request with correlationId property for easy access in handlers
   * @example
   * ```typescript
   * // In a route handler:
   * fastify.get('/', (request, reply) => {
   *   const correlationId = request.correlationId;
   * });
   * ```
   */
  fastify.decorateRequest('correlationId', {
    getter() {
      return (this as any).correlationId;
    },
  });
};

export default fastifyTelemetry;
