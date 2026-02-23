import type { FastifyInstance, FastifyError, FastifyRequest, FastifyReply } from 'fastify';
import type { Logger } from 'pino';
import { formatHttpError } from '../../../errors';
import { isZodError, mapZodError } from './zod-mapper';
import { getCorrelationId } from '../../../telemetry';

/**
 * Fastify error handler plugin
 * 
 * Transforms all errors into structured HTTP responses using formatHttpError.
 * Features:
 * - Maps ZodError → ValidationError automatically
 * - Handles DomainException/SystemException with proper status codes
 * - Masks unknown errors (500 Internal Server Error)
 * - Injects correlation ID into all error responses
 * - Logs errors with appropriate severity (warn for 4xx, error for 5xx)
 * 
 * @example
 * ```typescript
 * import { fastifyErrorHandler } from '@nauticalstream/sdk/server/fastify';
 * 
 * await server.register(fastifyErrorHandler);
 * 
 * // Routes can now just throw - plugin handles formatting:
 * server.post('/users', async (req) => {
 *   const data = UserSchema.parse(req.body); // throws ZodError → 400
 *   if (!exists) throw new NotFoundError('User', id); // → 404
 *   return { success: true };
 * });
 * ```
 */
export async function fastifyErrorHandler(server: FastifyInstance): Promise<void> {
  server.setErrorHandler((error: FastifyError | Error, request: FastifyRequest, reply: FastifyReply) => {
    const logger = request.log as Logger;

    // Map ZodError to ValidationError
    let mappedError: Error = error;
    if (isZodError(error)) {
      mappedError = mapZodError(error, 'Invalid request data');
    }

    // Format error using SDK formatter
    const formatted = formatHttpError(mappedError);

    // Ensure correlation ID is present
    if (!formatted.correlationId) {
      formatted.correlationId = getCorrelationId();
    }

    // Log with appropriate severity
    if (formatted.statusCode >= 500) {
      logger.error(
        {
          error: mappedError,
          correlationId: formatted.correlationId,
          path: request.url,
          method: request.method,
        },
        `[${formatted.statusCode}] ${formatted.message}`
      );
    } else {
      logger.warn(
        {
          errorCode: formatted.errorCode,
          correlationId: formatted.correlationId,
          path: request.url,
          method: request.method,
        },
        `[${formatted.statusCode}] ${formatted.message}`
      );
    }

    // Send formatted response
    reply.status(formatted.statusCode).send(formatted);
  });
}
