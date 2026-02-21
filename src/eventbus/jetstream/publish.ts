import type { NatsClient } from '../client/nats-client';
import type { Logger } from 'pino';
import { create, type Message, type MessageInitShape } from '@bufbuild/protobuf';
import type { GenMessage } from '@bufbuild/protobuf/codegenv2';
import { classifyNatsError } from '../errors';
import { buildEnvelope } from '../core/envelope';
import { jetstreamPublishLatency, jetstreamPublishSuccess, jetstreamPublishAttempts, jetstreamRetryAttempts, jetstreamPublishErrors } from '../core/metrics';
import { resilientOperation, getOrCreateCircuitBreaker, shouldRetry, type ResilientCircuitBreaker } from '../../resilience';
import { DEFAULT_RETRY_CONFIG, type RetryConfig } from '../core/config';
import { deriveSubject } from '../utils/derive-subject';

export interface JetStreamPublishOptions {
  correlationId?: string;
  subject?: string;
  retryConfig?: RetryConfig;
}

// Circuit breaker shared across all JetStream publishes
let natsBreaker: ResilientCircuitBreaker | undefined;

function getNatsBreaker(): ResilientCircuitBreaker {
  if (!natsBreaker) {
    natsBreaker = getOrCreateCircuitBreaker('nats-default');
  }
  return natsBreaker;
}

/** Publish to JetStream with retry, circuit breaker and timeout */
export async function publish<T extends Message>(
  client: NatsClient,
  logger: Logger,
  source: string,
  schema: GenMessage<T>,
  data: MessageInitShape<GenMessage<T>>,
  options?: JetStreamPublishOptions
): Promise<{ ok: boolean; error?: boolean }> {
  const message = create(schema, data);
  const subject = options?.subject ?? deriveSubject(schema.typeName);
  const correlationId = options?.correlationId;
  const config = { ...DEFAULT_RETRY_CONFIG, ...options?.retryConfig };

  jetstreamPublishAttempts.add(1, { subject });

  try {
    const js = client.getJetStream();
    const { binary, event, headers } = buildEnvelope(source, subject, schema, message, correlationId);

    await resilientOperation(
      () => js.publish(subject, binary, { headers }),
      {
        operation: 'jetstream.publish',
        logger,
        classifier: classifyNatsError,
        shouldRetry,
        retry: config,
        breaker: getNatsBreaker(),
        timeoutMs: config.operationTimeout,
        metrics: {
          latency: jetstreamPublishLatency,
          success: jetstreamPublishSuccess,
          errors: jetstreamPublishErrors,
          retries: jetstreamRetryAttempts,
        },
        labels: { subject },
      }
    );

    logger.debug({ subject, bytes: binary.length, correlationId: event.correlationId }, 'Published to JetStream');
    return { ok: true };
  } catch (err) {
    logger.warn({ subject, error: err }, 'JetStream publish failed');
    return { ok: false, error: true };
  }
}
