import { getCorrelationId, generateCorrelationId } from '../../../telemetry';
import { formatGraphQLError } from '../../../errors';

/** Mercurius error formatter response shape */
export interface MercuriusErrorFormatterResponse {
  statusCode: number;
  response: {
    errors?: Array<{
      message: string;
      locations?: ReadonlyArray<{ line: number; column: number }>;
      path?: ReadonlyArray<string | number>;
      extensions?: Record<string, any>;
    }>;
    data?: any;
  };
}

/**
 * Creates a Mercurius error formatter that injects `correlationId` into every GraphQL error.
 * Logs 5xx errors with full stack traces for debugging.
 *
 * @example
 * server.register(mercuriusFederation, {
 *   errorFormatter: createGraphQLErrorFormatter(),
 * });
 */
export function createGraphQLErrorFormatter() {
  return (execution: any, _context: any): MercuriusErrorFormatterResponse => {
    const statusCode = execution.statusCode || 200;
    // In Mercurius, _context is the Fastify Request — logger is at request.server.log
    const logger = _context?.server?.log || _context?.app?.log || _context?.log || console;

    return {
      statusCode,
      response: {
        ...execution,
        errors: execution.errors?.map((err: any) => {
          const formatted = formatGraphQLError(err);
          
          // Prefer the correlationId from the Mercurius request context (set by createContext),
          // which is always correct even when Mercurius calls errorFormatter outside the OTel
          // AsyncLocalStorage scope. Fall back through OTel context and finally generate one.
          const correlationId =
            _context?.correlationId ||
            formatted.extensions?.correlationId ||
            getCorrelationId() ||
            generateCorrelationId();

          // Log unexpected errors (INTERNAL_SERVER_ERROR) with full original error details
          if (formatted.extensions?.code === 'INTERNAL_SERVER_ERROR') {
            const original = err.originalError || err;
            const logData = {
              correlationId,
              path: err.path,
              locations: err.locations,
              errorName: original?.name,
              errorMessage: original?.message,
              stack: original?.stack,
              cause: original?.cause,
            };
            if (logger.error) {
              logger.error(logData, `[GraphQL INTERNAL_SERVER_ERROR] ${original?.message || err.message}`);
            } else {
              console.error(`[GraphQL INTERNAL_SERVER_ERROR] ${original?.message || err.message}`, logData);
            }
          }
          
          return {
            ...formatted,
            extensions: {
              ...formatted.extensions,
              correlationId,
            },
          };
        }),
      },
    };
  };
}
