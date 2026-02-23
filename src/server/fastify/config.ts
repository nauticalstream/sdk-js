/**
 * Server library constants and defaults.
 * All magic strings and default values live here — plugins and the factory
 * import from this file so there is a single source of truth.
 */

/** Default service name used by createFastifyServer when none is provided */
export const DEFAULT_SERVICE_NAME = 'fastify';

/**
 * Default correlation ID header name.
 * Matched by the telemetry plugin (incoming extraction) and onSend hook
 * (outgoing echo back to the caller).
 */
export const DEFAULT_CORRELATION_ID_HEADER = 'x-correlation-id';

/** Request logging is enabled by default */
export const DEFAULT_REQUEST_LOGGING = true;
