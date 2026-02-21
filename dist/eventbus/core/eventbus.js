import { NatsClient } from '../client/nats-client';
import { JetStreamAPI } from '../jetstream/api';
import * as corePublish from './publish';
import * as coreSubscribe from './subscribe';
import * as coreQueueGroup from './queue-group';
import * as coreRequest from './request';
import * as coreReply from './reply';
import { defaultLogger } from '../utils/logger';
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
export class EventBus {
    client;
    logger;
    source;
    jetstream;
    constructor(config) {
        this.logger = config.logger || defaultLogger.child({ service: config.name });
        this.source = config.name;
        this.client = new NatsClient({
            servers: config.servers,
            name: config.name,
            logger: this.logger
        });
        this.jetstream = new JetStreamAPI(this.client, this.logger, this.source);
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
//# sourceMappingURL=eventbus.js.map