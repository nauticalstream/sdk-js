import { type LoggerOptions, type Logger } from 'pino';
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
 * Create a Pino logger with automatic correlation ID and trace ID injection
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
 */
export declare function createLogger(options?: TelemetryLoggerOptions): Logger;
//# sourceMappingURL=logging.d.ts.map