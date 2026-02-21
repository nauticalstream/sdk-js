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
 *
 * @example
 * server.register(mercuriusFederation, {
 *   errorFormatter: createGraphQLErrorFormatter(),
 * });
 */
export function createGraphQLErrorFormatter() {
  return (execution: any, _context: any): MercuriusErrorFormatterResponse => {
    return {
      statusCode: execution.statusCode || 200,
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
