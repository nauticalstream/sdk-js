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
exports.EventBus = void 0;
const nats_client_1 = require("../client/nats-client");
const api_1 = require("../jetstream/api");
const corePublish = __importStar(require("./publish"));
const coreSubscribe = __importStar(require("./subscribe"));
const coreQueueGroup = __importStar(require("./queue-group"));
const coreRequest = __importStar(require("./request"));
const coreReply = __importStar(require("./reply"));
const logger_1 = require("../utils/logger");
/**
 * EventBus - Unified API for NATS messaging patterns
 *
 * Core NATS (ephemeral):
 *   - bus.publish()
 *   - bus.subscribe()
 *   - bus.queueGroup()
 *   - bus.request()
 *   - bus.reply()
 *
 * JetStream (persistent):
 *   - bus.jetstream.publish()
 *   - bus.jetstream.subscribe()
 *   - bus.jetstream.workQueue()
 *   - bus.jetstream.replay()
 *   - bus.jetstream.kv()
 *   - bus.jetstream.objectStore()
 */
class EventBus {
    constructor(config) {
        this.logger = config.logger || logger_1.defaultLogger.child({ service: config.name });
        this.source = config.name;
        this.client = new nats_client_1.NatsClient({
            servers: config.servers,
            name: config.name,
            logger: this.logger
        });
        this.jetstream = new api_1.JetStreamAPI(this.client, this.logger, this.source);
    }
    /**
     * Connect to NATS server
     */
    async connect() {
        await this.client.connect();
    }
    /**
     * Disconnect from NATS server
     */
    async disconnect() {
        await this.client.disconnect();
    }
    /**
     * Check connection status
     */
    get connected() {
        return this.client.connected;
    }
    // ============================================
    // CORE NATS PATTERNS (Ephemeral)
    // ============================================
    /**
     * Publish message (ephemeral, fire-and-forget)
     * Payload is automatically wrapped in a platform.v1.Event envelope.
     */
    async publish(subject, schema, data, correlationId) {
        return corePublish.publish(this.client, this.logger, this.source, subject, schema, data, correlationId);
    }
    /**
     * Subscribe to subject (ephemeral)
     * Handler receives the deserialized payload and the full Event envelope.
     */
    async subscribe(subject, schema, handler) {
        return coreSubscribe.subscribe(this.client, this.logger, subject, schema, handler);
    }
    /**
     * Subscribe with queue group (load balancing)
     * Handler receives the deserialized payload and the full Event envelope.
     */
    async queueGroup(subject, queueGroupName, schema, handler) {
        return coreQueueGroup.queueGroup(this.client, this.logger, subject, queueGroupName, schema, handler);
    }
    /**
     * Request/reply (synchronous RPC)
     * Both request and response are wrapped in Event envelopes.
     */
    async request(subject, reqSchema, respSchema, data, timeoutMs = 5000) {
        return coreRequest.request(this.client, this.logger, this.source, subject, reqSchema, respSchema, data, timeoutMs);
    }
    /**
     * Handle requests (reply handler)
     * Handler receives the deserialized request and Event envelope; return value is re-wrapped in an Event echoing the inbound correlationId.
     */
    async reply(subject, reqSchema, respSchema, handler) {
        return coreReply.reply(this.client, this.logger, { subject, source: this.source, reqSchema, respSchema, handler });
    }
}
exports.EventBus = EventBus;
//# sourceMappingURL=eventbus.js.map