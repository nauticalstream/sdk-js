import { type LoggerOptions, type Logger, type DestinationStream } from 'pino';
export interface TelemetryLoggerOptions extends LoggerOptions {
    name?: string;
    /** Optional Sentry integration for automatic error capture */
    sentry?: {
        /** Enable automatic error capture from logs */
        enabled: boolean;
        /** Minimum log level to capture (default: 'error') */
        minLevel?: 'error' | 'fatal';
    };
}
/**
 * Logger type that's compatible with both Pino and Fastify
 * Pino's Logger implements all methods required by Fastify's logger interface
 */
export type TelemetryLogger = Logger;
/**
 * Create a Pino logger with automatic trace/span ID injection and — when a
 * correlation ID is present in the active OTel context — correlation ID injection.
 *
 * Uses `peekCorrelationId()` (not `getCorrelationId()`) so that log lines
 * emitted outside a request/message handler do NOT get synthetic UUIDs that
 * would never match any trace in Grafana Loki.
 *
 * @param options - Logger options
 * @param options.name - Logger name (appears in logs and Sentry events)
 * @param options.sentry - Optional Sentry integration for error logs
 *
 * @example
 * ```typescript
 * // Basic logger
 * const logger = createLogger({ name: 'my-service' });
 *
 * // Logger with Sentry integration
 * const logger = createLogger({
 *   name: 'my-service',
 *   sentry: { enabled: true, minLevel: 'error' }
 * });
 * ```
 *
 * @returns Pino logger instance compatible with Fastify
 */
export declare function createLogger(options?: TelemetryLoggerOptions, destination?: DestinationStream): TelemetryLogger;
//# sourceMappingURL=logging.d.ts.map