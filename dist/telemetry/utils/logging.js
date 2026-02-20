"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createLogger = createLogger;
const pino_1 = __importDefault(require("pino"));
const context_js_1 = require("./context.js");
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
function createLogger(options = {}) {
    const { sentry, ...pinoOptions } = options;
    const baseOptions = {
        ...pinoOptions,
        // Mixin to add telemetry context to every log
        mixin() {
            const correlationId = (0, context_js_1.getCorrelationId)();
            const traceId = (0, context_js_1.getTraceId)();
            const spanId = (0, context_js_1.getSpanId)();
            const telemetryContext = {};
            if (correlationId) {
                telemetryContext.correlationId = correlationId;
            }
            if (traceId) {
                telemetryContext.traceId = traceId;
            }
            if (spanId) {
                telemetryContext.spanId = spanId;
            }
            return telemetryContext;
        },
    };
    // Optional: Add Sentry hook for automatic error capture
    if (sentry?.enabled) {
        // Create hook without dynamic imports (import Sentry at module level instead)
        let SentryModule = null;
        baseOptions.hooks = {
            logMethod(inputArgs, method, level) {
                const minLevel = sentry.minLevel === 'fatal' ? 60 : 50;
                // Only capture error/fatal logs to Sentry
                if (level >= minLevel) {
                    // Lazy-load Sentry only once
                    if (!SentryModule) {
                        try {
                            // NOTE: This import is wrapped in try-catch and only happens once
                            SentryModule = require('@sentry/node');
                        }
                        catch (err) {
                            // Sentry not available, skip
                            return method.apply(this, inputArgs);
                        }
                    }
                    if (!SentryModule) {
                        return method.apply(this, inputArgs);
                    }
                    const [obj, msg] = inputArgs;
                    const error = obj?.error || obj?.err || new Error(typeof msg === 'string' ? msg : JSON.stringify(msg));
                    // Use the loaded Sentry module
                    SentryModule.withScope((scope) => {
                        scope.setContext('log', obj);
                        scope.setTag('logger', options.name || 'unknown');
                        scope.setTag('correlationId', (0, context_js_1.getCorrelationId)() || 'none');
                        scope.setTag('traceId', (0, context_js_1.getTraceId)() || 'none');
                        SentryModule.captureException(error);
                    });
                }
                return method.apply(this, inputArgs);
            },
        };
    }
    return (0, pino_1.default)(baseOptions);
}
//# sourceMappingURL=logging.js.map