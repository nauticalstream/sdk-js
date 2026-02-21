import { AckPolicy, DeliverPolicy } from 'nats';
import { fromBinary } from '@bufbuild/protobuf';
import { EventSchema } from '@nauticalstream/proto/platform/v1/event_pb';
import { publish as jsPublish } from './publish';
import { withSubscribeSpan } from '../core/telemetry';
import { defaultErrorClassifier } from './subscribe';
/**
 * JetStream API - persistent, reliable, durable operations
 */
export class JetStreamAPI {
    client;
    logger;
    source;
    constructor(client, logger, source) {
        this.client = client;
        this.logger = logger;
        this.source = source;
    }
    /**
     * Publish to JetStream (persistent)
     * Payload is automatically wrapped in a platform.v1.Event envelope.
     */
    async publish(subject, schema, data, correlationId) {
        return jsPublish(this.client, this.logger, this.source, subject, schema, data, correlationId);
    }
    /**
     * Subscribe to JetStream with durable consumer.
     * Deserializes incoming binary data using the provided protobuf schema.
     */
    async subscribe(config) {
        const { stream, consumer: consumerName, subject, schema, handler, concurrency = 1, retryDelayMs = 500, maxDeliveries = 5, errorClassifier = defaultErrorClassifier } = config;
        try {
            if (!this.client.connected) {
                this.logger.warn({ subject }, 'NATS not connected');
                return async () => { };
            }
            const js = this.client.getJetStream();
            this.logger.info({ stream, consumer: consumerName, subject }, 'Creating JetStream consumer');
            const jsm = await this.client.getJetStreamManager();
            let consumer;
            try {
                await jsm.consumers.info(stream, consumerName);
                this.logger.debug({ consumer: consumerName }, 'Using existing consumer');
            }
            catch {
                this.logger.info({ consumer: consumerName }, 'Creating new JetStream consumer');
                await jsm.consumers.add(stream, {
                    name: consumerName,
                    durable_name: consumerName,
                    ack_policy: AckPolicy.Explicit,
                    filter_subject: subject,
                    deliver_policy: DeliverPolicy.All,
                    max_deliver: maxDeliveries
                });
            }
            consumer = await js.consumers.get(stream, consumerName);
            const messages = await consumer.consume({ max_messages: 100 });
            let active = 0;
            const queue = [];
            let stopped = false;
            const processNext = async () => {
                if (active >= concurrency || stopped)
                    return;
                const msg = queue.shift();
                if (!msg)
                    return;
                active++;
                try {
                    const envelope = fromBinary(EventSchema, msg.data);
                    const data = fromBinary(schema, envelope.payload);
                    await withSubscribeSpan(subject, msg.headers ?? undefined, () => handler(data, envelope));
                    msg.ack();
                }
                catch (err) {
                    const action = errorClassifier(err);
                    const errorName = err instanceof Error ? err.constructor.name : 'UnknownError';
                    const errorMessage = err instanceof Error ? err.message : String(err);
                    switch (action) {
                        case 'retry':
                            this.logger.error({ err, errorName, errorMessage, subject, consumer: consumerName }, 'Transient error - will retry after delay');
                            msg.nak(retryDelayMs);
                            break;
                        case 'discard':
                            this.logger.warn({ errorName, errorMessage, subject, consumer: consumerName }, 'Non-retryable error - discarding message');
                            msg.ack(); // ACK to remove from queue
                            break;
                        case 'deadletter':
                            this.logger.error({ err, errorName, errorMessage, subject, consumer: consumerName }, 'Fatal error - marking as poison message (deadletter)');
                            msg.term(); // Terminal error - requires manual intervention
                            break;
                    }
                }
                finally {
                    active--;
                    void processNext();
                }
            };
            const loop = (async () => {
                try {
                    for await (const msg of messages) {
                        if (stopped)
                            break;
                        queue.push(msg);
                        void processNext();
                    }
                }
                catch (err) {
                    if (!stopped) {
                        this.logger.error({ err }, 'Consumer stopped unexpectedly');
                    }
                }
            })();
            this.logger.info({ stream, consumer: consumerName, subject }, 'JetStream consumer started');
            return async () => {
                stopped = true;
                await messages.close();
                await loop;
                this.logger.info({ consumer: consumerName }, 'JetStream consumer closed');
            };
        }
        catch (err) {
            this.logger.error({ err, stream, consumer: config.consumer, subject }, 'Failed to create consumer');
            return async () => { };
        }
    }
    /**
     * Work queue pattern - at-least-once delivery
     */
    async workQueue(config) {
        const consumerName = `${config.stream}-workqueue-${Date.now()}`;
        return this.subscribe({
            stream: config.stream,
            consumer: consumerName,
            subject: config.subject,
            schema: config.schema,
            handler: config.handler,
            concurrency: 1
        });
    }
    /**
     * Replay stream from timestamp
     */
    async replay(config) {
        const { stream, startTime, startSequence, subject = '>', schema, handler } = config;
        try {
            const js = this.client.getJetStream();
            const consumerName = `replay-${Date.now()}`;
            const jsm = await this.client.getJetStreamManager();
            let deliverPolicy = DeliverPolicy.All;
            const consumerOpts = {
                name: consumerName,
                ack_policy: AckPolicy.Explicit,
                filter_subject: subject
            };
            if (startTime) {
                deliverPolicy = DeliverPolicy.StartTime;
                consumerOpts.opt_start_time = new Date(startTime).toISOString();
            }
            else if (startSequence) {
                deliverPolicy = DeliverPolicy.StartSequence;
                consumerOpts.opt_start_seq = startSequence;
            }
            consumerOpts.deliver_policy = deliverPolicy;
            await jsm.consumers.add(stream, consumerOpts);
            const consumer = await js.consumers.get(stream, consumerName);
            const messages = await consumer.consume({ max_messages: 100 });
            let stopped = false;
            const loop = (async () => {
                try {
                    for await (const msg of messages) {
                        if (stopped)
                            break;
                        const envelope = fromBinary(EventSchema, msg.data);
                        const data = fromBinary(schema, envelope.payload);
                        await withSubscribeSpan(subject, msg.headers ?? undefined, () => handler(data, envelope));
                        msg.ack();
                    }
                }
                catch (err) {
                    this.logger.error({ err }, 'Replay stopped unexpectedly');
                }
            })();
            this.logger.info({ stream, startTime, startSequence }, 'Stream replay started');
            return async () => {
                stopped = true;
                await messages.close();
                await loop;
                await jsm.consumers.delete(stream, consumerName);
                this.logger.info('Stream replay closed');
            };
        }
        catch (err) {
            this.logger.error({ err, stream }, 'Failed to start replay');
            return async () => { };
        }
    }
    /**
     * Get Key-Value store bucket
     */
    async kv(bucketName) {
        const js = this.client.getJetStream();
        const jsm = await this.client.getJetStreamManager();
        try {
            // Try to get existing bucket
            return await js.views.kv(bucketName);
        }
        catch {
            // Create new bucket
            this.logger.info({ bucket: bucketName }, 'Creating KV bucket');
            await jsm.streams.add({
                name: `KV_${bucketName}`,
                subjects: [`$KV.${bucketName}.>`]
            });
            return await js.views.kv(bucketName);
        }
    }
    /**
     * Get Object Store bucket
     */
    async objectStore(bucketName) {
        const js = this.client.getJetStream();
        const jsm = await this.client.getJetStreamManager();
        try {
            return await js.views.os(bucketName);
        }
        catch {
            this.logger.info({ bucket: bucketName }, 'Creating object store bucket');
            await jsm.streams.add({
                name: `OBJ_${bucketName}`,
                subjects: [`$O.${bucketName}.>`]
            });
            return await js.views.os(bucketName);
        }
    }
}
//# sourceMappingURL=api.js.map