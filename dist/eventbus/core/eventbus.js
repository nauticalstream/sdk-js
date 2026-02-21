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
     * Subject is automatically derived from schema.typeName.
     *
     * @throws Error if NATS is not connected
     */
    async publish(schema, data, options) {
        return corePublish.publish(this.client, this.logger, this.source, schema, data, options);
    }
    /**
     * Subscribe to subject (ephemeral)
     * Handler receives the deserialized payload and the full Event envelope.
     * Subject is automatically derived from schema.typeName.
     *
     * @throws Error if NATS is not connected
     * @returns Cleanup function to unsubscribe
     */
    async subscribe(schema, handler) {
        return coreSubscribe.subscribe(this.client, this.logger, schema, handler);
    }
    /**
     * Subscribe with queue group (load balancing)
     * Handler receives the deserialized payload and the full Event envelope.
     * Subject is automatically derived from schema.typeName.
     *
     * @throws Error if NATS is not connected
     * @returns Cleanup function to unsubscribe
     */
    async queueGroup(schema, handler, options) {
        return coreQueueGroup.queueGroup(this.client, this.logger, schema, handler, options);
    }
    /**
     * Request/reply (synchronous RPC)
     * Both request and response are wrapped in Event envelopes.
     * Subject is automatically derived from reqSchema.typeName.
     *
     * @throws Error if NATS is not connected, request times out, or receives error response
     */
    async request(reqSchema, respSchema, data, options) {
        return coreRequest.request(this.client, this.logger, this.source, reqSchema, respSchema, data, options);
    }
    /**
     * Handle requests (reply handler)
     * Handler receives the deserialized request and Event envelope; return value is re-wrapped in an Event echoing the inbound correlationId.
     * Subject is automatically derived from reqSchema.typeName.
     *
     * @throws Error if NATS is not connected
     * @returns Cleanup function to unsubscribe
     */
    async reply(reqSchema, respSchema, handler, options) {
        return coreReply.reply(this.client, this.logger, {
            source: this.source,
            reqSchema,
            respSchema,
            handler,
            options
        });
    }
}
//# sourceMappingURL=eventbus.js.map