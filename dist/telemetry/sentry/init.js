"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.initSentry = initSentry;
exports.getSentry = getSentry;
exports.closeSentry = closeSentry;
const Sentry = __importStar(require("@sentry/node"));
const profiling_node_1 = require("@sentry/profiling-node");
const context_js_1 = require("../utils/context.js");
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
function initSentry(config) {
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
            (0, profiling_node_1.nodeProfilingIntegration)(),
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
                correlationId: (0, context_js_1.getCorrelationId)(),
                traceId: (0, context_js_1.getTraceId)(),
                spanId: (0, context_js_1.getSpanId)(),
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
function getSentry() {
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
async function closeSentry() {
    if (!sentryInitialized) {
        return true;
    }
    console.log('[Sentry] Closing...');
    return Sentry.close(2000);
}
//# sourceMappingURL=init.js.map