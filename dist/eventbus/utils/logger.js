"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultLogger = void 0;
const telemetry_1 = require("../../telemetry");
/**
 * Default logger for @nauticalstream/eventbus package.
 *
 * Sentry is disabled by default for packages - services can enable it
 * by providing their own logger with sentry.enabled = true.
 */
exports.defaultLogger = (0, telemetry_1.createLogger)({
    name: '@nauticalstream/eventbus',
    level: process.env.LOG_LEVEL || 'info',
    sentry: {
        enabled: false,
    },
});
//# sourceMappingURL=logger.js.map