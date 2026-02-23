import { fromJson, type Message, type MessageInitShape } from '@bufbuild/protobuf';
import type { GenMessage } from '@bufbuild/protobuf/codegenv2';
import type { Logger } from 'pino';
import type { NatsClient } from '../client/nats-client';
import { buildEnvelope, parseEnvelope } from '../envelope';
import { deriveSubject } from '../utils/derive-subject';
import { DEFAULT_REQUEST_TIMEOUT_MS } from '../config';
import type { RequestOptions } from '../types';

/**
 * NATS Core request/reply — synchronous RPC caller side.
 * Sends a platform.v1.Event envelope and awaits a typed response.
 * Subject is auto-derived from reqSchema.typeName.
 *
 * @throws if NATS is disconnected, the request times out, or the responder signals an error
 *         (response envelope has no data field).
 */
export async function request<TRequest extends Message, TResponse extends Message>(
  client: NatsClient,
  logger: Logger,
  source: string,
  reqSchema: GenMessage<TRequest>,
  respSchema: GenMessage<TResponse>,
  data: MessageInitShape<GenMessage<TRequest>>,
  options?: RequestOptions
): Promise<TResponse> {
  if (!client.connected) throw new Error('NATS not connected — cannot make request');

  const subject = deriveSubject(reqSchema.typeName);
  const timeoutMs = options?.timeoutMs ?? DEFAULT_REQUEST_TIMEOUT_MS;
  const { payload, event } = buildEnvelope(source, subject, reqSchema, data, options?.correlationId);

  logger.debug({ subject, correlationId: event.correlationId }, 'Sending NATS request');

  try {
    const response = await client.getConnection().request(subject, payload, { timeout: timeoutMs });
    const responseEnvelope = parseEnvelope(response.data);

    // Responder signals handler failure by sending an event with no data.
    if (!responseEnvelope.data) throw new Error(`Request to ${subject} returned error response`);

    const result = fromJson(respSchema, responseEnvelope.data) as TResponse;
    logger.debug({ subject, correlationId: responseEnvelope.correlationId }, 'Request completed');
    return result;
  } catch (err) {
    logger.error({ subject, error: err }, 'Request failed');
    throw new Error(`Request to ${subject} failed: ${err instanceof Error ? err.message : err}`);
  }
}
