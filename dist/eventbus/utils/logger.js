import { createLogger } from '../../telemetry';
/**
 * Default logger for the eventbus module.
 * Services should pass their own logger via EventBusConfig to override this.
 * Sentry is disabled here — services control that integration.
 */
export const defaultLogger = createLogger({
    name: '@nauticalstream/eventbus',
    level: process.env.LOG_LEVEL || 'info',
    sentry: { enabled: false },
});
//# sourceMappingURL=logger.js.map