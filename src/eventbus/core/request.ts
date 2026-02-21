import type { NatsClient } from '../client/nats-client';
import type { Logger } from 'pino';
import type { Message, MessageInitShape } from '@bufbuild/protobuf';
import type { GenMessage } from '@bufbuild/protobuf/codegenv2';
import { create, fromBinary } from '@bufbuild/protobuf';
import { EventSchema, type Event } from '@nauticalstream/proto/platform/v1/event_pb';
import { buildEnvelope } from './envelope';

/**
 * Make a request/reply call to another service (RPC pattern)
 * Request and response are both wrapped in platform.v1.Event envelopes.
 * Core NATS - synchronous RPC pattern
 */
export async function request<TRequest extends Message, TResponse extends Message>(
  client: NatsClient,
  logger: Logger,
  source: string,
  subject: string,
  reqSchema: GenMessage<TRequest>,
  respSchema: GenMessage<TResponse>,
  data: MessageInitShape<GenMessage<TRequest>>,
  timeoutMs = 5000
): Promise<TResponse | null> {
  try {
    if (!client.connected) {
      logger.warn({ subject }, 'NATS not connected - cannot make request');
      return null;
    }

    const connection = client.getConnection();
    const message = create(reqSchema, data);
    const { binary, event } = buildEnvelope(source, subject, reqSchema, message);

    logger.debug({ subject, correlationId: event.correlationId }, 'Making NATS request');

    const response = await connection.request(subject, binary, { timeout: timeoutMs });
    const responseEnvelope = fromBinary(EventSchema, response.data) as Event;

    // Empty payload means the responder signalled an error
    if (responseEnvelope.payload.length === 0) {
      logger.warn({ subject, correlationId: responseEnvelope.correlationId }, 'Request returned error response');
      return null;
    }

    const result = fromBinary(respSchema, responseEnvelope.payload) as TResponse;
    logger.debug({ subject, correlationId: responseEnvelope.correlationId }, 'Request completed successfully');
    return result;
  } catch (err) {
    logger.warn({ subject, error: err }, 'Request failed');
    return null;
  }
}
