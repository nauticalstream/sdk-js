import { NatsClient } from '../client/nats-client';
import { JetStreamAPI } from '../jetstream/api';
import * as corePublish from './publish';
import * as coreSubscribe from './subscribe';
import * as coreQueueGroup from './queue-group';
import * as coreRequest from './request';
import * as coreReply from './reply';
import { defaultLogger } from '../utils/logger';
/** EventBus - NATS messaging with ephemeral and persistent patterns */
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
    /** Connect to NATS server */
    async connect() {
        await this.client.connect();
    }
    /** Disconnect from NATS server */
    async disconnect() {
        await this.client.disconnect();
    }
    /** Check connection status */
    get connected() {
        return this.client.connected;
    }
    /** Publish message (ephemeral, fire-and-forget) */
    async publish(schema, data, options) {
        return corePublish.publish(this.client, this.logger, this.source, schema, data, options);
    }
    /** Subscribe to subject (ephemeral) */
    async subscribe(schema, handler) {
        return coreSubscribe.subscribe(this.client, this.logger, schema, handler);
    }
    /** Subscribe with queue group (load balancing) */
    async queueGroup(schema, handler, options) {
        return coreQueueGroup.queueGroup(this.client, this.logger, schema, handler, options);
    }
    /** Request/reply (synchronous RPC) */
    async request(reqSchema, respSchema, data, options) {
        return coreRequest.request(this.client, this.logger, this.source, reqSchema, respSchema, data, options);
    }
    /** Handle requests (reply handler) */
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