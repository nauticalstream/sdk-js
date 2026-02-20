"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.circuitBreakerState = exports.publishErrorsByType = exports.retryAttempts = exports.publishAttempts = exports.publishSuccess = exports.publishLatency = exports.getBreakerMetrics = exports.resetBreaker = exports.withMessageSpan = exports.withPublishSpan = exports.createPublishProperties = exports.deserializeProto = exports.serializeProto = exports.workspaceTopics = exports.notificationTopics = exports.presenceTopics = exports.chatTopics = exports.TOPICS = exports.MQTTClientManager = exports.RealtimeClient = void 0;
// Main RealtimeClient API
var realtime_client_1 = require("./core/realtime-client");
Object.defineProperty(exports, "RealtimeClient", { enumerable: true, get: function () { return realtime_client_1.RealtimeClient; } });
// MQTT Client
var mqtt_client_1 = require("./client/mqtt-client");
Object.defineProperty(exports, "MQTTClientManager", { enumerable: true, get: function () { return mqtt_client_1.MQTTClientManager; } });
// Topics
var topics_1 = require("./topics");
Object.defineProperty(exports, "TOPICS", { enumerable: true, get: function () { return topics_1.TOPICS; } });
Object.defineProperty(exports, "chatTopics", { enumerable: true, get: function () { return topics_1.chatTopics; } });
Object.defineProperty(exports, "presenceTopics", { enumerable: true, get: function () { return topics_1.presenceTopics; } });
Object.defineProperty(exports, "notificationTopics", { enumerable: true, get: function () { return topics_1.notificationTopics; } });
Object.defineProperty(exports, "workspaceTopics", { enumerable: true, get: function () { return topics_1.workspaceTopics; } });
// Utilities
var serialization_1 = require("./utils/serialization");
Object.defineProperty(exports, "serializeProto", { enumerable: true, get: function () { return serialization_1.serializeProto; } });
Object.defineProperty(exports, "deserializeProto", { enumerable: true, get: function () { return serialization_1.deserializeProto; } });
var telemetry_1 = require("./core/telemetry");
Object.defineProperty(exports, "createPublishProperties", { enumerable: true, get: function () { return telemetry_1.createPublishProperties; } });
Object.defineProperty(exports, "withPublishSpan", { enumerable: true, get: function () { return telemetry_1.withPublishSpan; } });
Object.defineProperty(exports, "withMessageSpan", { enumerable: true, get: function () { return telemetry_1.withMessageSpan; } });
// Circuit Breaker (for operational management)
var circuit_breaker_1 = require("./core/circuit-breaker");
Object.defineProperty(exports, "resetBreaker", { enumerable: true, get: function () { return circuit_breaker_1.resetBreaker; } });
Object.defineProperty(exports, "getBreakerMetrics", { enumerable: true, get: function () { return circuit_breaker_1.getBreakerMetrics; } });
// Metrics (for observability and monitoring)
var metrics_1 = require("./core/metrics");
Object.defineProperty(exports, "publishLatency", { enumerable: true, get: function () { return metrics_1.publishLatency; } });
Object.defineProperty(exports, "publishSuccess", { enumerable: true, get: function () { return metrics_1.publishSuccess; } });
Object.defineProperty(exports, "publishAttempts", { enumerable: true, get: function () { return metrics_1.publishAttempts; } });
Object.defineProperty(exports, "retryAttempts", { enumerable: true, get: function () { return metrics_1.retryAttempts; } });
Object.defineProperty(exports, "publishErrorsByType", { enumerable: true, get: function () { return metrics_1.publishErrorsByType; } });
Object.defineProperty(exports, "circuitBreakerState", { enumerable: true, get: function () { return metrics_1.circuitBreakerState; } });
//# sourceMappingURL=index.js.map