import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';
import type { SentryConfig } from './config';
import { getCorrelationId, getTraceId, getSpanId } from '../utils/context';

let sentryInitialized = false;

/**
 * Initialize Sentry error tracking
 * Should be called once at application startup, before any other code
 * 
 * @example
 * ```typescript
 * import { initSentry } from '@nauticalstream/telemetry';
 * 
 * initSentry({
 *   dsn: process.env.SENTRY_DSN,
 *   environment: 'production',
 *   enabled: true,
 * });
 * ```
 */
export function initSentry(config: SentryConfig): void {
  if (!config.enabled || !config.dsn) {
    console.log('[Sentry] Disabled or no DSN provided');
    return;
  }

  if (sentryInitialized) {
    console.warn('[Sentry] Already initialized');
    return;
  }

  Sentry.init({
    dsn: config.dsn,
    environment: config.environment,
    release: config.release,
    tracesSampleRate: config.tracesSampleRate || 0.1,
    profilesSampleRate: config.profilesSampleRate || 0.1,
    
    integrations: [
      // Performance profiling
      nodeProfilingIntegration(),
      
      // Auto-capture uncaught exceptions (process-level)
      Sentry.onUncaughtExceptionIntegration({
        onFatalError: async (err) => {
          console.error('[Sentry] Fatal uncaught exception:', err);
          process.exit(1);
        },
      }),
      
      // Auto-capture unhandled promise rejections
      Sentry.onUnhandledRejectionIntegration({ 
        mode: 'warn' 
      }),
    ],
    
    // Filter out noisy errors
    ignoreErrors: config.ignoreErrors || [],
    
    // Enrich every event with telemetry context
    beforeSend: (event, hint) => {
      // Add trace context to all events
      event.contexts = event.contexts || {};
      event.contexts.telemetry = {
        correlationId: getCorrelationId(),
        traceId: getTraceId(),
        spanId: getSpanId(),
      };
      
      // Custom filtering
      if (config.beforeSend) {
        return config.beforeSend(event, hint);
      }
      
      return event;
    },
  });

  sentryInitialized = true;
  console.log(`[Sentry] Initialized for ${config.environment}`);
}

/**
 * Get Sentry instance for manual error capture
 * 
 * @example
 * ```typescript
 * import { getSentry } from '@nauticalstream/telemetry';
 * 
 * const { Sentry } = getSentry();
 * 
 * Sentry.withScope((scope) => {
 *   scope.setContext('payment', { orderId: '123' });
 *   Sentry.captureException(error);
 * });
 * ```
 */
export function getSentry() {
  return { Sentry };
}

/**
 * Gracefully close Sentry
 * Call this during application shutdown to flush pending events
 * 
 * @example
 * ```typescript
 * process.on('SIGTERM', async () => {
 *   await server.close();
 *   await closeSentry();
 *   process.exit(0);
 * });
 * ```
 */
export async function closeSentry(): Promise<boolean> {
  if (!sentryInitialized) {
    return true;
  }
  console.log('[Sentry] Closing...');
  const result = await Sentry.close(2000);
  sentryInitialized = false;
  return result;
}
