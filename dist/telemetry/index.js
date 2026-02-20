"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_SENTRY_CONFIG = exports.Sentry = exports.closeSentry = exports.getSentry = exports.initSentry = exports.fastifyTelemetry = exports.startTimer = exports.createObservableGauge = exports.recordGauge = exports.recordHistogram = exports.recordCounter = exports.createLogger = exports.getActiveSpan = exports.generateCorrelationId = exports.withCorrelationId = exports.setCorrelationId = exports.getSpanId = exports.getTraceId = exports.getCorrelationId = exports.meter = exports.tracer = exports.withSpan = exports.getMeter = exports.getTracer = exports.shutdownTelemetry = exports.initTelemetry = void 0;
// Core telemetry initialization
var telemetry_js_1 = require("./telemetry.js");
Object.defineProperty(exports, "initTelemetry", { enumerable: true, get: function () { return telemetry_js_1.initTelemetry; } });
Object.defineProperty(exports, "shutdownTelemetry", { enumerable: true, get: function () { return telemetry_js_1.shutdownTelemetry; } });
Object.defineProperty(exports, "getTracer", { enumerable: true, get: function () { return telemetry_js_1.getTracer; } });
Object.defineProperty(exports, "getMeter", { enumerable: true, get: function () { return telemetry_js_1.getMeter; } });
Object.defineProperty(exports, "withSpan", { enumerable: true, get: function () { return telemetry_js_1.withSpan; } });
Object.defineProperty(exports, "tracer", { enumerable: true, get: function () { return telemetry_js_1.tracer; } });
Object.defineProperty(exports, "meter", { enumerable: true, get: function () { return telemetry_js_1.meter; } });
// Context utilities
var context_js_1 = require("./utils/context.js");
Object.defineProperty(exports, "getCorrelationId", { enumerable: true, get: function () { return context_js_1.getCorrelationId; } });
Object.defineProperty(exports, "getTraceId", { enumerable: true, get: function () { return context_js_1.getTraceId; } });
Object.defineProperty(exports, "getSpanId", { enumerable: true, get: function () { return context_js_1.getSpanId; } });
Object.defineProperty(exports, "setCorrelationId", { enumerable: true, get: function () { return context_js_1.setCorrelationId; } });
Object.defineProperty(exports, "withCorrelationId", { enumerable: true, get: function () { return context_js_1.withCorrelationId; } });
Object.defineProperty(exports, "generateCorrelationId", { enumerable: true, get: function () { return context_js_1.generateCorrelationId; } });
Object.defineProperty(exports, "getActiveSpan", { enumerable: true, get: function () { return context_js_1.getActiveSpan; } });
// Logger with telemetry
var logging_js_1 = require("./utils/logging.js");
Object.defineProperty(exports, "createLogger", { enumerable: true, get: function () { return logging_js_1.createLogger; } });
// Metric helpers (OTel v2 - easy metric recording)
var metrics_js_1 = require("./utils/metrics.js");
Object.defineProperty(exports, "recordCounter", { enumerable: true, get: function () { return metrics_js_1.recordCounter; } });
Object.defineProperty(exports, "recordHistogram", { enumerable: true, get: function () { return metrics_js_1.recordHistogram; } });
Object.defineProperty(exports, "recordGauge", { enumerable: true, get: function () { return metrics_js_1.recordGauge; } });
Object.defineProperty(exports, "createObservableGauge", { enumerable: true, get: function () { return metrics_js_1.createObservableGauge; } });
Object.defineProperty(exports, "startTimer", { enumerable: true, get: function () { return metrics_js_1.startTimer; } });
// Fastify plugin
var fastify_telemetry_plugin_js_1 = require("./plugins/fastify-telemetry.plugin.js");
Object.defineProperty(exports, "fastifyTelemetry", { enumerable: true, get: function () { return fastify_telemetry_plugin_js_1.fastifyTelemetry; } });
// Sentry integration
var index_js_1 = require("./sentry/index.js");
Object.defineProperty(exports, "initSentry", { enumerable: true, get: function () { return index_js_1.initSentry; } });
Object.defineProperty(exports, "getSentry", { enumerable: true, get: function () { return index_js_1.getSentry; } });
Object.defineProperty(exports, "closeSentry", { enumerable: true, get: function () { return index_js_1.closeSentry; } });
Object.defineProperty(exports, "Sentry", { enumerable: true, get: function () { return index_js_1.Sentry; } });
var config_js_1 = require("./sentry/config.js");
Object.defineProperty(exports, "DEFAULT_SENTRY_CONFIG", { enumerable: true, get: function () { return config_js_1.DEFAULT_SENTRY_CONFIG; } });
//# sourceMappingURL=index.js.map