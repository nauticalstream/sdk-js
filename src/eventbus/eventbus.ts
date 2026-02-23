import type { Message, MessageInitShape } from '@bufbuild/protobuf';
import type { GenMessage } from '@bufbuild/protobuf/codegenv2';
import type { Logger } from 'pino';
import { NatsClient } from './client/nats-client';
import { JetStreamAPI } from './jetstream/api';
import * as natsPublish from './nats/publish';
import * as natsSubscribe from './nats/subscribe';
import * as natsQueueGroup from './nats/queue-group';
import * as natsRequest from './nats/request';
import * as natsReply from './nats/reply';
import { defaultLogger } from './utils/logger';
import type { Event } from './envelope';
import type {
  PublishOptions,
  QueueGroupOptions,
  RequestOptions,
  ReplyOptions,
  Unsubscribe,
} from './types';

export interface EventBusConfig {
  servers: string[];
  /** Service name — used as Event.source on every published message. */
  name: string;
  logger?: Logger;
}

/**
 * EventBus — unified NATS messaging facade for the Nauticalstream platform.
 *
 * - Core NATS  (publish / subscribe / queueGroup / request / reply) — ephemeral, fast
 * - JetStream  (this.jetstream.*)                                   — persistent, durable
 *
 * All messages are wrapped in a platform.v1.Event envelope encoded as JSON on the wire.
 */
export class EventBus {
  private client: NatsClient;
  private logger: Logger;
  private source: string;

  /** JetStream API — persistent, durable, at-least-once delivery. */
  public jetstream: JetStreamAPI;

  constructor(config: EventBusConfig) {
    this.logger = config.logger ?? defaultLogger.child({ service: config.name });
    this.source = config.name;
    this.client = new NatsClient({ servers: config.servers, name: config.name, logger: this.logger });
    this.jetstream = new JetStreamAPI(this.client, this.logger, this.source);
  }

  /** Connect to NATS. Must be called before any publish/subscribe. */
  async connect(): Promise<void> {
    await this.client.connect();
  }

  /** Drain in-flight messages then disconnect. */
  async disconnect(): Promise<void> {
    await this.client.disconnect();
  }

  get connected(): boolean {
    return this.client.connected;
  }

  /** Fire-and-forget publish to NATS Core (ephemeral). */
  async publish<T extends Message>(
    schema: GenMessage<T>,
    data: MessageInitShape<GenMessage<T>>,
    options?: PublishOptions
  ): Promise<void> {
    return natsPublish.publish(this.client, this.logger, this.source, schema, data, options);
  }

  /** Subscribe to a NATS Core subject (ephemeral). */
  async subscribe<T extends Message>(
    schema: GenMessage<T>,
    handler: (data: T, envelope: Event) => Promise<void>
  ): Promise<Unsubscribe> {
    return natsSubscribe.subscribe(this.client, this.logger, schema, handler);
  }

  /** Subscribe to a NATS Core subject with load-balancing queue group. */
  async queueGroup<T extends Message>(
    schema: GenMessage<T>,
    handler: (data: T, envelope: Event) => Promise<void>,
    options: QueueGroupOptions
  ): Promise<Unsubscribe> {
    return natsQueueGroup.queueGroup(this.client, this.logger, schema, handler, options);
  }

  /** Synchronous RPC — send request and await typed response. */
  async request<TReq extends Message, TRes extends Message>(
    reqSchema: GenMessage<TReq>,
    respSchema: GenMessage<TRes>,
    data: MessageInitShape<GenMessage<TReq>>,
    options?: RequestOptions
  ): Promise<TRes> {
    return natsRequest.request(this.client, this.logger, this.source, reqSchema, respSchema, data, options);
  }

  /** Synchronous RPC — register a server-side reply handler. */
  async reply<TReq extends Message, TRes extends Message>(
    reqSchema: GenMessage<TReq>,
    respSchema: GenMessage<TRes>,
    handler: (data: TReq, envelope: Event) => Promise<MessageInitShape<GenMessage<TRes>>>,
    options?: ReplyOptions
  ): Promise<Unsubscribe> {
    return natsReply.reply(this.client, this.logger, {
      source: this.source,
      reqSchema,
      respSchema,
      handler,
      options,
    });
  }
}
