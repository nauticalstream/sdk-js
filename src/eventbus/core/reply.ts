import type { NatsClient } from '../client/nats-client';
import type { Logger } from 'pino';
import type { Subscription } from 'nats';
import type { Message } from '@bufbuild/protobuf';
import type { GenMessage } from '@bufbuild/protobuf/codegenv2';
import { fromBinary, toBinary, create } from '@bufbuild/protobuf';
import { EventSchema, type Event } from '@nauticalstream/proto/platform/v1/event_pb';

export interface ReplyHandlerConfig<TRequest extends Message = any, TResponse extends Message = any> {
  subject: string;
  source: string;
  reqSchema: GenMessage<TRequest>;
  respSchema: GenMessage<TResponse>;
  handler: (data: TRequest, envelope: Event) => Promise<TResponse>;
}

/**
 * Subscribe to a request/reply subject (RPC server side)
 * Inbound binary is decoded as platform.v1.Event.
 * Response is re-wrapped in a new Event echoing the inbound correlationId.
 * Core NATS - synchronous RPC pattern (server side)
 */
export async function reply<TRequest extends Message = any, TResponse extends Message = any>(
  client: NatsClient,
  logger: Logger,
  config: ReplyHandlerConfig<TRequest, TResponse>
): Promise<() => Promise<void>> {
  const { subject, source, reqSchema, respSchema, handler } = config;

  try {
    if (!client.connected) {
      logger.warn({ subject }, 'NATS not connected - cannot subscribe to requests');
      return async () => {};
    }

    const connection = client.getConnection();

    logger.info({ subject }, 'Subscribing to request/reply subject');

    const subscription: Subscription = connection.subscribe(subject, {
      callback: async (err, msg) => {
        if (err) {
          logger.error({ err, subject }, 'Request subscription error');
          return;
        }

        let inboundCorrelationId: string | undefined;

        try {
          const inboundEnvelope = fromBinary(EventSchema, msg.data) as Event;
          inboundCorrelationId = inboundEnvelope.correlationId;
          const data = fromBinary(reqSchema, inboundEnvelope.payload) as TRequest;

          logger.debug({ subject, correlationId: inboundCorrelationId }, 'Processing request');
          const response = await handler(data, inboundEnvelope);

          // Echo the inbound correlationId so callers can correlate the pair
          const responseEnvelope = create(EventSchema, {
            type: subject,
            source,
            correlationId: inboundCorrelationId,
            timestamp: new Date().toISOString(),
            payload: toBinary(respSchema, response),
          });
          msg.respond(toBinary(EventSchema, responseEnvelope));
        } catch (error) {
          logger.error({ error, subject }, 'Request handler failed');
          // Respond with an empty-payload envelope so the caller can detect the error
          const errorEnvelope = create(EventSchema, {
            type: `${subject}.error`,
            source,
            correlationId: inboundCorrelationId ?? crypto.randomUUID(),
            timestamp: new Date().toISOString(),
          });
          msg.respond(toBinary(EventSchema, errorEnvelope));
        }
      }
    });

    logger.info({ subject }, 'Request/reply subscription established');

    // Cleanup function
    return async () => {
      try {
        subscription.unsubscribe();
        logger.info({ subject }, 'Request/reply subscription closed');
      } catch (err) {
        logger.error({ err, subject }, 'Error during request subscription shutdown');
      }
    };
  } catch (err) {
    logger.error({ err, subject }, 'Failed to subscribe to request/reply subject');
    return async () => {};
  }
}
