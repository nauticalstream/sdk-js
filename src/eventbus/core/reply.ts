import type { NatsClient } from '../client/nats-client';
import type { Logger } from 'pino';
import type { Subscription } from 'nats';
import { type Message, type MessageInitShape, fromBinary, toBinary, create } from '@bufbuild/protobuf';
import type { GenMessage } from '@bufbuild/protobuf/codegenv2';
import { EventSchema, type Event } from '@nauticalstream/proto/platform/v1/event_pb';
import { deriveSubject } from '../utils/derive-subject';
import type { ReplyOptions, Unsubscribe } from './types';

export interface ReplyHandlerConfig<TRequest extends Message, TResponse extends Message> {
  source: string;
  reqSchema: GenMessage<TRequest>;
  respSchema: GenMessage<TResponse>;
  handler: (data: TRequest, envelope: Event) => Promise<MessageInitShape<GenMessage<TResponse>>>;
  options?: ReplyOptions;
}

/**
 * Subscribe to a request/reply subject (RPC server side)
 * Inbound binary is decoded as platform.v1.Event.
 * Response is re-wrapped in a new Event echoing the inbound correlationId.
 * Core NATS - synchronous RPC pattern (server side)
 * 
 * The NATS subject is automatically derived from the request schema's typeName.
 * For example, "user.v1.GetUserRequest" becomes subject "user.v1.get-user-request"
 * 
 * @throws Error if NATS is not connected or schema is invalid
 */
export async function reply<TRequest extends Message, TResponse extends Message>(
  client: NatsClient,
  logger: Logger,
  config: ReplyHandlerConfig<TRequest, TResponse>
): Promise<Unsubscribe> {
  const { source, reqSchema, respSchema, handler } = config;
  const subject = deriveSubject(reqSchema.typeName);

  if (!client.connected) {
    throw new Error('NATS not connected - cannot subscribe to requests');
  }

  try {

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
          const responseData = await handler(data, inboundEnvelope);
          const response = create(respSchema, responseData);

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
          // Error Signaling: Send empty payload envelope to indicate handler failure
          // This allows caller to fail fast instead of waiting for timeout
          // Caller checks payload.length === 0 to detect error and throw
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
    return () => {
      subscription.unsubscribe();
      logger.info({ subject }, 'Request/reply subscription closed');
    };
  } catch (err) {
    logger.error({ err, subject }, 'Failed to subscribe to request/reply subject');
    throw new Error(`Failed to subscribe to request/reply subject ${subject}: ${err}`);
  }
}
