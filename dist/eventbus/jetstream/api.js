import { fromJson } from '@bufbuild/protobuf';
import { publish as jsPublish } from './publish';
import { subscribe as jsSubscribe, defaultErrorClassifier } from './subscribe';
import { ensureEphemeralConsumer } from './consumer';
import { getKvBucket, getObjectStore } from './kv';
import { parseEnvelope } from '../envelope';
import { withSubscribeSpan } from '../observability/tracing';
/**
 * High-level JetStream API — persistent, durable, at-least-once delivery.
 * All methods delegate to focused single-responsibility modules.
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
     * Publish to JetStream with retry and circuit breaker.
     * Subject is auto-derived from schema.typeName unless overridden.
     */
    async publish(schema, data, options) {
        return jsPublish(this.client, this.logger, this.source, schema, data, options);
    }
    /**
     * Subscribe to a JetStream stream with a durable consumer.
     * Handler receives the typed domain message and the full platform.v1.Event envelope.
     * Use errorClassifier to control retry / discard / deadletter behaviour per error type.
     */
    async subscribe(config) {
        const { schema, handler, errorClassifier = defaultErrorClassifier, ...rest } = config;
        return jsSubscribe(this.client, this.logger, {
            ...rest,
            errorClassifier,
            handler: async (raw, msg) => {
                const envelope = parseEnvelope(raw);
                const data = fromJson(schema, envelope.data ?? {});
                await withSubscribeSpan(config.subject, msg.headers ?? undefined, () => handler(data, envelope));
            },
        });
    }
    /**
     * Work queue — at-least-once delivery with concurrency 1.
     * Uses a stable durable consumer name so messages queued during downtime
     * are delivered to the same consumer on restart.
     */
    async workQueue(config) {
        return this.subscribe({
            ...config,
            consumer: `${config.stream}-workqueue`,
            concurrency: 1,
        });
    }
    /**
     * Replay stream events starting from a timestamp or sequence number.
     * Uses an ephemeral consumer that is deleted on cleanup.
     */
    async replay(config) {
        const { stream, startTime, startSequence, subject = '>', schema, handler } = config;
        try {
            const jsm = await this.client.getJetStreamManager();
            const js = this.client.getJetStream();
            const { consumer, name } = await ensureEphemeralConsumer(jsm, js, stream, subject, { startTime, startSequence });
            const messages = await consumer.consume({ max_messages: 100 });
            let stopped = false;
            const loop = (async () => {
                try {
                    for await (const msg of messages) {
                        if (stopped)
                            break;
                        const envelope = parseEnvelope(msg.data);
                        const data = fromJson(schema, envelope.data ?? {});
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
                await jsm.consumers.delete(stream, name);
                this.logger.info('Stream replay closed');
            };
        }
        catch (err) {
            this.logger.error({ err, stream }, 'Failed to start replay');
            return async () => { };
        }
    }
    /** Get or create a JetStream Key-Value bucket. */
    kv(bucketName) {
        return getKvBucket(this.client, bucketName, this.logger);
    }
    /** Get or create a JetStream Object Store bucket. */
    objectStore(bucketName) {
        return getObjectStore(this.client, bucketName, this.logger);
    }
}
//# sourceMappingURL=api.js.map