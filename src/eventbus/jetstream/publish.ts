import { type Message, type MessageInitShape } from '@bufbuild/protobuf';
import type { GenMessage } from '@bufbuild/protobuf/codegenv2';
import type { Logger } from 'pino';
import type { NatsClient } from '../client/nats-client';
import { buildEnvelope } from '../envelope';
import { classifyNatsError } from '../errors/classify';
import {
  jetstreamPublishLatency,
  jetstreamPublishSuccess,
  jetstreamPublishAttempts,
  jetstreamRetryAttempts,
  jetstreamPublishErrors,
  jetstreamCircuitBreakerState,
} from '../observability/metrics';
import { resilientOperation, getOrCreateCircuitBreaker, shouldRetry, DEFAULT_CIRCUIT_BREAKER_CONFIG, type ResilientCircuitBreaker } from '../../resilience';
import { DEFAULT_RETRY_CONFIG, type RetryConfig } from '../config';
import { resetCircuitBreaker } from '../../resilience';

export interface JetStreamPublishOptions {
  /** Override the auto-derived subject. */
  subject?: string;
  /** Correlation ID for tracing. */
  correlationId?: string;
  /** Override default retry configuration. */
  retryConfig?: RetryConfig;
}

/**
 * Per-domain circuit breakers for JetStream publishes.
 * Keyed by the first subject segment (e.g. 'workspace', 'agency') so a slow
 * stream can't trip the breaker for unrelated domains.
 */
function getBreaker(domain: string): ResilientCircuitBreaker {
  return getOrCreateCircuitBreaker(`nats-${domain}`, { ...DEFAULT_CIRCUIT_BREAKER_CONFIG, stateMetric: jetstreamCircuitBreakerState });
}

/**
 * Publish a proto message to JetStream (persistent, at-least-once).
 * Wraps the message in a platform.v1.Event envelope, then publishes with
 * retry, circuit breaker, timeout, and OTel metrics.
 *
 * Returns { ok: true } on success or { ok: false, error: true } on final failure
 * so callers can decide whether to surface the error without an uncaught exception.
 */
export async function publish<T extends Message>(
  client: NatsClient,
  logger: Logger,
  source: string,
  schema: GenMessage<T>,
  data: MessageInitShape<GenMessage<T>>,
  options?: JetStreamPublishOptions
): Promise<{ ok: boolean; error?: boolean }> {
  const config = { ...DEFAULT_RETRY_CONFIG, ...options?.retryConfig };
  const { payload, event, headers } = buildEnvelope(source, schema, data, { subject: options?.subject, correlationId: options?.correlationId });
  const subject = event.type;

  jetstreamPublishAttempts.add(1, { subject });

  try {
    const js = client.getJetStream();

    await resilientOperation(
      () => js.publish(subject, payload, { headers }),
      {
        operation: 'jetstream.publish',
        logger,
        classifier: classifyNatsError,
        shouldRetry,
        retry: config,
        breaker: getBreaker(subject.split('.')[0]),
        metrics: {
          latency: jetstreamPublishLatency,
          success: jetstreamPublishSuccess,
          errors: jetstreamPublishErrors,
          retries: jetstreamRetryAttempts,
        },
        labels: { subject },
      }
    );

    logger.debug({ subject, correlationId: event.correlationId }, 'Published to JetStream');
    return { ok: true };
  } catch (err) {
    logger.warn({ subject, error: err }, 'JetStream publish failed');
    return { ok: false, error: true };
  }
}

/**
 * Reset a JetStream publish circuit breaker.
 * @param domain - Subject domain prefix (first segment), e.g. 'workspace', 'agency'.
 *                 Breaker key is `nats-${domain}`, so pass the full key if needed.
 * @example resetBreaker('workspace')  // resets nats-workspace
 */
export function resetBreaker(domain: string): void {
  resetCircuitBreaker(`nats-${domain}`);
}
