import * as Sentry from '@sentry/node';
import type { SentryConfig } from './config';
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
export declare function initSentry(config: SentryConfig): void;
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
export declare function getSentry(): {
    Sentry: typeof Sentry;
};
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
export declare function closeSentry(): Promise<boolean>;
//# sourceMappingURL=init.d.ts.map