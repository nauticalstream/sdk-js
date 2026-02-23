import { create, fromJson, type Message, type MessageInitShape, toJsonString } from '@bufbuild/protobuf';
import type { GenMessage } from '@bufbuild/protobuf/codegenv2';
import type { Subscription } from 'nats';
import type { Logger } from 'pino';
import type { NatsClient } from '../client/nats-client';
import { EventSchema } from '@nauticalstream/proto/platform/v1/event_pb';
import { buildEnvelope, parseEnvelope, type Event } from '../envelope';
import { withCorrelationId, generateCorrelationId } from '../../telemetry/utils/context';
import { deriveSubject } from '../utils/derive-subject';
import type { ReplyOptions, Unsubscribe } from '../types';

export interface ReplyHandlerConfig<TRequest extends Message, TResponse extends Message> {
  source: string;
  reqSchema: GenMessage<TRequest>;
  respSchema: GenMessage<TResponse>;
  /** Handler returns the response shape; a thrown error sends an error signal to the caller. */
  handler: (data: TRequest, envelope: Event) => Promise<MessageInitShape<GenMessage<TResponse>>>;
  options?: ReplyOptions;
}

/**
 * NATS Core request/reply — synchronous RPC server side.
 * Listens on the subject derived from reqSchema.typeName.
 * Decodes each inbound request, runs the handler, and responds with a new Event envelope.
 * On handler error: responds with an Event that has no data field — request() caller will throw.
 *
 * @throws if NATS is disconnected at subscribe time.
 */
export async function reply<TRequest extends Message, TResponse extends Message>(
  client: NatsClient,
  logger: Logger,
  config: ReplyHandlerConfig<TRequest, TResponse>
): Promise<Unsubscribe> {
  const { source, reqSchema, respSchema, handler } = config;

  if (!client.connected) throw new Error('NATS not connected — cannot subscribe to requests');

  const subject = deriveSubject(reqSchema.typeName);
  logger.info({ subject }, 'Subscribing to request/reply subject');

  const subscription: Subscription = client.getConnection().subscribe(subject, {
    callback: async (err, msg) => {
      if (err) { logger.error({ err, subject }, 'Request subscription error'); return; }

      let correlationId: string | undefined;
      try {
        const inbound = parseEnvelope(msg.data);
        correlationId = inbound.correlationId;
        const data = fromJson(reqSchema, inbound.data ?? {}) as TRequest;

        logger.debug({ subject, correlationId }, 'Processing request');

        const responseData = await withCorrelationId(
          correlationId ?? generateCorrelationId(),
          () => handler(data, inbound)
        );
        const { payload } = buildEnvelope(source, subject, respSchema, responseData, correlationId ?? generateCorrelationId());
        msg.respond(payload);
      } catch (error) {
        logger.error({ error, subject }, 'Request handler failed');
        // Signal failure: respond with an Event that has no data — caller's request() will throw.
        const errorEvent = create(EventSchema, {
          type: `${subject}.error`,
          source,
          correlationId: correlationId ?? generateCorrelationId(),
          timestamp: new Date().toISOString(),
        });
        msg.respond(toJsonString(EventSchema, errorEvent));
      }
    },
  });

  logger.info({ subject }, 'Request/reply subscription established');
  return () => {
    subscription.unsubscribe();
    logger.info({ subject }, 'Request/reply subscription closed');
  };
}
