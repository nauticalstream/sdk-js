"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultLogger = void 0;
const telemetry_1 = require("../../telemetry");
/**
 * Default logger for @nauticalstream/realtime package
 * Used when no logger is provided in configuration
 *
 * Sentry integration is disabled by default in packages.
 * Services should enable it explicitly if needed.
 */
exports.defaultLogger = (0, telemetry_1.createLogger)({
    name: '@nauticalstream/realtime',
    level: process.env.LOG_LEVEL || 'info',
    // Sentry disabled in packages - let services control this
    sentry: {
        enabled: false,
    },
});
//# sourceMappingURL=logger.js.map