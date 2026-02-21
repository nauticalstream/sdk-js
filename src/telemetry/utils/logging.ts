import pino, { type LoggerOptions, type Logger } from 'pino';
import { getCorrelationId, getTraceId, getSpanId } from './context';
// NOTE: Sentry import is lazy-loaded to avoid circular dependencies during initialization
import type * as SentryType from '@sentry/node';

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
export function createLogger(options: TelemetryLoggerOptions = {}): Logger {
  const { sentry, ...pinoOptions } = options;
  
  const baseOptions: LoggerOptions = {
    ...pinoOptions,
    // Mixin to add telemetry context to every log
    mixin() {
      const correlationId = getCorrelationId();
      const traceId = getTraceId();
      const spanId = getSpanId();

      const telemetryContext: Record<string, string> = {};

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
    let SentryModule: typeof SentryType | null = null;
    
    baseOptions.hooks = {
      logMethod(inputArgs, method, level) {
        const minLevel = sentry.minLevel === 'fatal' ? 60 : 50;
        
        // Only capture error/fatal logs to Sentry
        if (level >= minLevel) {
          // Lazy-load Sentry only once
          if (!SentryModule) {
            try {
              // NOTE: This import is wrapped in try-catch and only happens once
              SentryModule = require('@sentry/node') as typeof SentryType;
            } catch (err) {
              // Sentry not available, skip
              return method.apply(this, inputArgs);
            }
          }
          
          if (!SentryModule) {
            return method.apply(this, inputArgs);
          }
          
          const [obj, msg] = inputArgs as [any, string];
          const error = obj?.error || obj?.err || new Error(
            typeof msg === 'string' ? msg : JSON.stringify(msg)
          );
          
          // Use the loaded Sentry module
          SentryModule.withScope((scope) => {
            scope.setContext('log', obj);
            scope.setTag('logger', options.name || 'unknown');
            scope.setTag('correlationId', getCorrelationId() || 'none');
            scope.setTag('traceId', getTraceId() || 'none');
            
            SentryModule!.captureException(error);
          });
        }
        
        return method.apply(this, inputArgs);
      },
    };
  }

  return pino(baseOptions);
}
