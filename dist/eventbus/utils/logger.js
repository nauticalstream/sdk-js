import { createLogger } from '../../telemetry';
/**
 * Default logger for @nauticalstream/eventbus package.
 *
 * Sentry is disabled by default for packages - services can enable it
 * by providing their own logger with sentry.enabled = true.
 */
export const defaultLogger = createLogger({
    name: '@nauticalstream/eventbus',
    level: process.env.LOG_LEVEL || 'info',
    sentry: {
        enabled: false,
    },
});
//# sourceMappingURL=logger.js.map