import pino from 'pino';
import { peekCorrelationId, getTraceId, getSpanId } from './context';
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
export function createLogger(options = {}, destination) {
    const { sentry, ...pinoOptions } = options;
    // Capture user-supplied mixin BEFORE we overwrite it.
    // We compose: user fields first, then telemetry fields (telemetry wins on conflict
    // so traceId/correlationId are always present and cannot be clobbered).
    const userMixin = pinoOptions.mixin;
    const baseOptions = {
        ...pinoOptions,
        mixin(mergeObject, level) {
            const correlationId = peekCorrelationId();
            const traceId = getTraceId();
            const spanId = getSpanId();
            const telemetryFields = {};
            if (correlationId)
                telemetryFields.correlationId = correlationId;
            if (traceId)
                telemetryFields.traceId = traceId;
            if (spanId)
                telemetryFields.spanId = spanId;
            // Merge user fields first so telemetry fields take priority on key collision.
            const userFields = userMixin ? userMixin(mergeObject, level) : {};
            return { ...userFields, ...telemetryFields };
        },
    };
    // Optional: Sentry hook — module resolved once at logger creation, not per-call.
    if (sentry?.enabled) {
        let SentryModule = null;
        try {
            SentryModule = require('@sentry/node');
        }
        catch {
            // @sentry/node is an optional peer dependency; skip if absent.
        }
        // Capture the user's existing logMethod (if any) so we can chain into it
        // instead of replacing it. Replacing would silently drop the user's hook.
        const userLogMethod = pinoOptions.hooks?.logMethod;
        baseOptions.hooks = {
            logMethod(inputArgs, method, level) {
                const minLevel = sentry.minLevel === 'fatal' ? 60 : 50;
                // Only capture error/fatal logs to Sentry
                if (level >= minLevel) {
                    if (SentryModule) {
                        // Normalise the various Pino call signatures to a single Error:
                        //   logger.error(err)                  → inputArgs = [Error]
                        //   logger.error({ err }, 'msg')        → inputArgs = [{ err }, 'msg']
                        //   logger.error({ error }, 'msg')      → inputArgs = [{ error }, 'msg']
                        //   logger.error('plain string')        → inputArgs = ['plain string']
                        const firstArg = inputArgs[0];
                        let capturedError;
                        let logContext = firstArg;
                        if (firstArg instanceof Error) {
                            capturedError = firstArg;
                        }
                        else if (typeof firstArg === 'object' && firstArg !== null) {
                            const raw = firstArg.error ?? firstArg.err;
                            const msgArg = inputArgs[1];
                            capturedError = raw instanceof Error
                                ? raw
                                : new Error(typeof msgArg === 'string' ? msgArg : JSON.stringify(firstArg));
                        }
                        else {
                            // logger.error('plain string message')
                            capturedError = new Error(typeof firstArg === 'string' ? firstArg : JSON.stringify(firstArg));
                            logContext = undefined;
                        }
                        SentryModule.withScope((scope) => {
                            if (logContext !== undefined)
                                scope.setContext('log', logContext);
                            scope.setTag('logger', options.name || 'unknown');
                            const correlationId = peekCorrelationId();
                            if (correlationId)
                                scope.setTag('correlationId', correlationId);
                            const traceId = getTraceId();
                            if (traceId)
                                scope.setTag('traceId', traceId);
                            SentryModule.captureException(capturedError);
                        });
                    }
                }
                // Chain into the user's logMethod if one was provided; otherwise
                // call the underlying Pino log method directly.
                if (userLogMethod) {
                    return userLogMethod.call(this, inputArgs, method, level);
                }
                return method.apply(this, inputArgs);
            },
        };
    }
    return destination ? pino(baseOptions, destination) : pino(baseOptions);
}
//# sourceMappingURL=logging.js.map