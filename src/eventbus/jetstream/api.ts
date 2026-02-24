import { fromJson, type Message, type MessageInitShape } from '@bufbuild/protobuf';
import type { GenMessage } from '@bufbuild/protobuf/codegenv2';
import type { KV, ObjectStore } from 'nats';
import type { Logger } from 'pino';
import type { NatsClient } from '../client/nats-client';
import type { Event } from '@nauticalstream/proto/platform/v1/event_pb';
import { publish as jsPublish, type JetStreamPublishOptions } from './publish';
import { subscribe as jsSubscribe, defaultErrorClassifier, type ErrorClassifier } from './subscribe';
import { ensureEphemeralConsumer } from './consumer';
import { getKvBucket, getObjectStore } from './kv';
import { parseEnvelope } from '../envelope';
import { withSubscribeSpan } from '../observability/tracing';
import { deriveSubject } from '../utils/derive-subject';

/**
 * High-level JetStream API — persistent, durable, at-least-once delivery.
 * All methods delegate to focused single-responsibility modules.
 */
export class JetStreamAPI {
  constructor(
    private client: NatsClient,
    private logger: Logger,
    private source: string
  ) {}

  /**
   * Publish to JetStream with retry and circuit breaker.
   * Subject is auto-derived from schema.typeName unless overridden.
   */
  async publish<T extends Message>(
    schema: GenMessage<T>,
    data: MessageInitShape<GenMessage<T>>,
    options?: JetStreamPublishOptions
  ): Promise<{ ok: boolean; error?: boolean }> {
    return jsPublish(this.client, this.logger, this.source, schema, data, options);
  }

  /**
   * Subscribe to a JetStream stream with a durable consumer.
   * Handler receives the typed domain message and the full platform.v1.Event envelope.
   * Use errorClassifier to control retry / discard / deadletter behaviour per error type.
   * Subject is auto-derived from schema.typeName unless overridden.
   */
  async subscribe<T extends Message>(config: {
    stream: string;
    consumer: string;
    subject?: string;
    schema: GenMessage<T>;
    handler: (data: T, envelope: Event) => Promise<void>;
    concurrency?: number;
    retryDelayMs?: number;
    maxDeliveries?: number;
    errorClassifier?: ErrorClassifier;
  }): Promise<() => Promise<void>> {
    const { schema, handler, errorClassifier = defaultErrorClassifier, ...rest } = config;
    const subject = config.subject ?? deriveSubject(schema.typeName);

    return jsSubscribe(this.client, this.logger, {
      ...rest,
      subject,
      errorClassifier,
      handler: async (raw, msg) => {
        const envelope = parseEnvelope(raw);
        const data = fromJson(schema, envelope.data ?? {}) as T;
        await withSubscribeSpan(subject, msg.headers ?? undefined, () => handler(data, envelope));
      },
    });
  }

  /**
   * Work queue — at-least-once delivery with concurrency 1.
   * Uses a stable durable consumer name so messages queued during downtime
   * are delivered to the same consumer on restart.
   */
  async workQueue<T extends Message>(config: {
    stream: string;
    subject: string;
    schema: GenMessage<T>;
    handler: (data: T, envelope: Event) => Promise<void>;
    maxDeliveries?: number;
  }): Promise<() => Promise<void>> {
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
  async replay<T extends Message>(config: {
    stream: string;
    startTime?: number;
    startSequence?: number;
    subject?: string;
    schema: GenMessage<T>;
    handler: (data: T, envelope: Event) => Promise<void>;
  }): Promise<() => Promise<void>> {
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
            if (stopped) break;
            const envelope = parseEnvelope(msg.data);
            const data = fromJson(schema, envelope.data ?? {}) as T;
            await withSubscribeSpan(subject, msg.headers ?? undefined, () => handler(data, envelope));
            msg.ack();
          }
        } catch (err) {
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
    } catch (err) {
      this.logger.error({ err, stream }, 'Failed to start replay');
      return async () => {};
    }
  }

  /** Get or create a JetStream Key-Value bucket. */
  kv(bucketName: string): Promise<KV> {
    return getKvBucket(this.client, bucketName, this.logger);
  }

  /** Get or create a JetStream Object Store bucket. */
  objectStore(bucketName: string): Promise<ObjectStore> {
    return getObjectStore(this.client, bucketName, this.logger);
  }
}
