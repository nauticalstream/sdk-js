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

export interface EventBusConfig {
  servers: string[];
  name: string;
  logger?: Logger;
}

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

  /**
   * Connect to NATS server
   */
  async connect(): Promise<void> {
    await this.client.connect();
  }

  /**
   * Disconnect from NATS server
   */
  async disconnect(): Promise<void> {
    await this.client.disconnect();
  }

  /**
   * Check connection status
   */
  get connected(): boolean {
    return this.client.connected;
  }

  // ============================================
  // CORE NATS PATTERNS (Ephemeral)
  // ============================================

  /**
   * Publish message (ephemeral, fire-and-forget)
   * Payload is automatically wrapped in a platform.v1.Event envelope.
   */
  async publish<T extends Message>(
    subject: string,
    schema: GenMessage<T>,
    data: T,
    correlationId?: string
  ): Promise<void> {
    return corePublish.publish(this.client, this.logger, this.source, subject, schema, data, correlationId);
  }

  /**
   * Subscribe to subject (ephemeral)
   * Handler receives the deserialized payload and the full Event envelope.
   */
  async subscribe<T extends Message>(
    subject: string,
    schema: GenMessage<T>,
    handler: (data: T, envelope: Event) => Promise<void>
  ): Promise<() => void> {
    return coreSubscribe.subscribe(this.client, this.logger, subject, schema, handler);
  }

  /**
   * Subscribe with queue group (load balancing)
   * Handler receives the deserialized payload and the full Event envelope.
   */
  async queueGroup<T extends Message>(
    subject: string,
    queueGroupName: string,
    schema: GenMessage<T>,
    handler: (data: T, envelope: Event) => Promise<void>
  ): Promise<() => void> {
    return coreQueueGroup.queueGroup(this.client, this.logger, subject, queueGroupName, schema, handler);
  }

  /**
   * Request/reply (synchronous RPC)
   * Both request and response are wrapped in Event envelopes.
   */
  async request<TRequest extends Message, TResponse extends Message>(
    subject: string,
    reqSchema: GenMessage<TRequest>,
    respSchema: GenMessage<TResponse>,
    data: MessageInitShape<GenMessage<TRequest>>,
    timeoutMs = 5000
  ): Promise<TResponse | null> {
    return coreRequest.request(this.client, this.logger, this.source, subject, reqSchema, respSchema, data, timeoutMs);
  }

  /**
   * Handle requests (reply handler)
   * Handler receives the deserialized request and Event envelope; return value is re-wrapped in an Event echoing the inbound correlationId.
   */
  async reply<TRequest extends Message, TResponse extends Message>(
    subject: string,
    reqSchema: GenMessage<TRequest>,
    respSchema: GenMessage<TResponse>,
    handler: (data: TRequest, envelope: Event) => Promise<TResponse>
  ): Promise<() => Promise<void>> {
    return coreReply.reply(this.client, this.logger, { subject, source: this.source, reqSchema, respSchema, handler });
  }
}
