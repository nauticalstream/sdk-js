import { NatsClient } from '../client/nats-client';
import { JetStreamAPI } from '../jetstream/api';
import * as corePublish from './publish';
import * as coreSubscribe from './subscribe';
import * as coreQueueGroup from './queue-group';
import * as coreRequest from './request';
import * as coreReply from './reply';
import type { Logger } from 'pino';
import { defaultLogger } from '../utils/logger';
import type { Message, MessageInitShape } from '@bufbuild/protobuf';
import type { GenMessage } from '@bufbuild/protobuf/codegenv2';
import type { Event } from '@nauticalstream/proto/platform/v1/event_pb';
import type { 
  PublishOptions, 
  QueueGroupOptions, 
  RequestOptions, 
  ReplyOptions,
  Unsubscribe 
} from './types';

export interface EventBusConfig {
  servers: string[];
  name: string;
  logger?: Logger;
}

/** EventBus - NATS messaging with ephemeral and persistent patterns */
export class EventBus {
  private client: NatsClient;
  private logger: Logger;
  private source: string;
  public jetstream: JetStreamAPI;

  constructor(config: EventBusConfig) {
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
  async connect(): Promise<void> {
    await this.client.connect();
  }

  /** Disconnect from NATS server */
  async disconnect(): Promise<void> {
    await this.client.disconnect();
  }

  /** Check connection status */
  get connected(): boolean {
    return this.client.connected;
  }

  /** Publish message (ephemeral, fire-and-forget) */
  async publish<T extends Message>(
    schema: GenMessage<T>,
    data: MessageInitShape<GenMessage<T>>,
    options?: PublishOptions
  ): Promise<void> {
    return corePublish.publish(this.client, this.logger, this.source, schema, data, options);
  }

  /** Subscribe to subject (ephemeral) */
  async subscribe<T extends Message>(
    schema: GenMessage<T>,
    handler: (data: T, envelope: Event) => Promise<void>
  ): Promise<Unsubscribe> {
    return coreSubscribe.subscribe(this.client, this.logger, schema, handler);
  }

  /** Subscribe with queue group (load balancing) */
  async queueGroup<T extends Message>(
    schema: GenMessage<T>,
    handler: (data: T, envelope: Event) => Promise<void>,
    options: QueueGroupOptions
  ): Promise<Unsubscribe> {
    return coreQueueGroup.queueGroup(this.client, this.logger, schema, handler, options);
  }

  /** Request/reply (synchronous RPC) */
  async request<TRequest extends Message, TResponse extends Message>(
    reqSchema: GenMessage<TRequest>,
    respSchema: GenMessage<TResponse>,
    data: MessageInitShape<GenMessage<TRequest>>,
    options?: RequestOptions
  ): Promise<TResponse> {
    return coreRequest.request(this.client, this.logger, this.source, reqSchema, respSchema, data, options);
  }

  /** Handle requests (reply handler) */
  async reply<TRequest extends Message, TResponse extends Message>(
    reqSchema: GenMessage<TRequest>,
    respSchema: GenMessage<TResponse>,
    handler: (data: TRequest, envelope: Event) => Promise<MessageInitShape<GenMessage<TResponse>>>,
    options?: ReplyOptions
  ): Promise<Unsubscribe> {
    return coreReply.reply(this.client, this.logger, { 
      source: this.source, 
      reqSchema, 
      respSchema, 
      handler,
      options 
    });
  }
}
