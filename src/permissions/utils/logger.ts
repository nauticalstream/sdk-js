import { createLogger } from '../../telemetry';

/**
 * Default logger for @nauticalstream/permissions package
 * Used when no logger is provided in configuration
 * 
 * Sentry integration is disabled by default in packages.
 * Services should enable it explicitly if needed.
 */
export const defaultLogger = createLogger({
  name: '@nauticalstream/permissions',
  level: process.env.LOG_LEVEL || 'info',
  
  // Sentry disabled in packages - let services control this
  sentry: {
    enabled: false,
  },
});

