import type { FastifyRequest, FastifyReply, preValidationHookHandler } from 'fastify';
import type { ZodSchema } from 'zod';

/**
 * Fastify preValidation hook for Zod schema validation
 * 
 * Validates request body/query/params against Zod schema.
 * Throws ZodError on validation failure (caught by fastifyErrorHandler → 400).
 * 
 * @example
 * ```typescript
 * import { validateBody, validateQuery } from '@nauticalstream/sdk/server/fastify';
 * 
 * server.post('/users', {
 *   preValidation: validateBody(CreateUserSchema)
 * }, async (req) => {
 *   // req.body is now typed and validated
 *   return userService.create(req.body);
 * });
 * 
 * server.get('/users', {
 *   preValidation: validateQuery(PaginationSchema)
 * }, async (req) => {
 *   // req.query is validated
 *   return userService.list(req.query);
 * });
 * ```
 */

/**
 * Validate request body against Zod schema
 */
export function validateBody<T>(schema: ZodSchema<T>): preValidationHookHandler {
  return async (request: FastifyRequest, _reply: FastifyReply) => {
    // Throws ZodError if validation fails (caught by error handler)
    request.body = schema.parse(request.body);
  };
}

/**
 * Validate request query parameters against Zod schema
 */
export function validateQuery<T>(schema: ZodSchema<T>): preValidationHookHandler {
  return async (request: FastifyRequest, _reply: FastifyReply) => {
    request.query = schema.parse(request.query);
  };
}

/**
 * Validate request params against Zod schema
 */
export function validateParams<T>(schema: ZodSchema<T>): preValidationHookHandler {
  return async (request: FastifyRequest, _reply: FastifyReply) => {
    request.params = schema.parse(request.params);
  };
}
