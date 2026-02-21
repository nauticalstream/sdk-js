import type { NatsClient } from '../client/nats-client';
import type { Logger } from 'pino';
import type { Message } from '@bufbuild/protobuf';
import type { GenMessage } from '@bufbuild/protobuf/codegenv2';
import pRetry from 'p-retry';
import { classifyNatsError, shouldRetry } from '../errors';
import { buildEnvelope } from '../core/envelope';
import { jetstreamPublishLatency, jetstreamPublishSuccess, jetstreamPublishAttempts, jetstreamRetryAttempts, jetstreamPublishErrors } from '../core/metrics';
import { getOrCreateBreaker, isBreakerOpen } from '../core/circuit-breaker';
import { DEFAULT_RETRY_CONFIG, type RetryConfig } from '../core/config';
import { deriveSubject } from '../utils/derive-subject';

export interface JetStreamPublishOptions {
  /** Optional correlation ID for tracing */
  correlationId?: string;
  /** Override auto-derived subject (useful for wildcard subjects or custom routing) */
  subject?: string;
  /** Retry configuration (uses defaults if not provided) */
  retryConfig?: RetryConfig;
}

/**
 * Publish to JetStream (persistent)
 * Safe publisher — returns { ok: true } on success or { ok: false, error: true } on failure.
 * Payload is automatically wrapped in a platform.v1.Event envelope.
 * Implements smart retry logic that distinguishes infrastructure errors from application errors.
 * Uses circuit breaker to prevent cascading failures when NATS cluster is unhealthy.
 * 
 * Subject is auto-derived from schema.typeName unless overridden in options.
 */
export async function publish<T extends Message>(
  client: NatsClient,
  logger: Logger,
  source: string,
  schema: GenMessage<T>,
  data: T,
  options?: JetStreamPublishOptions
): Promise<{ ok: boolean; error?: boolean }> {
  const subject = options?.subject ?? deriveSubject(schema.typeName);
  const correlationId = options?.correlationId;
  const retryConfig = options?.retryConfig;
  const startTime = Date.now();
  jetstreamPublishAttempts.add(1, { subject });

  // Circuit Breaker Pattern: Fast-fail if NATS cluster is experiencing issues
  // Prevents cascading failures by rejecting requests when error threshold is exceeded
  // Breaker automatically resets after cooldown period to test recovery
  const serverCluster = 'nats-default';
  if (isBreakerOpen(serverCluster)) {
    jetstreamPublishErrors.add(1, { 
      subject, 
      errorType: 'CircuitBreakerOpenError' 
    });
    logger.warn({ subject }, 'NATS circuit breaker is open, rejecting publish');
    return { ok: false, error: true };
  }

  try {
    const js = client.getJetStream();
    const { binary, event, headers } = buildEnvelope(source, subject, schema, data, correlationId);
    const config = { ...DEFAULT_RETRY_CONFIG, ...retryConfig };
    
    const breaker = getOrCreateBreaker(serverCluster, logger);

    // Create abort controller for operation timeout
    const abortController = new AbortController();
    const timeoutId = setTimeout(() => abortController.abort(), config.operationTimeout);

    try {
      // Retry Pattern: Automatically retry transient failures with exponential backoff
      // Circuit Breaker: Track failure rate and open breaker if threshold exceeded
      // Flow: pRetry handles backoff → breaker tracks success/failure → opens on threshold
      await breaker.fire(async () => {
        return pRetry(
          () => js.publish(subject, binary, { headers }),
          {
            retries: config.maxRetries,
            minTimeout: config.initialDelayMs,
            maxTimeout: config.maxDelayMs,
            factor: config.backoffFactor,
            signal: abortController.signal,
            shouldRetry: (error) => shouldRetry(logger, subject, classifyNatsError(error)),
            onFailedAttempt: (error: any) => {
              jetstreamRetryAttempts.add(1, { 
                subject,
                attempt: error.attemptNumber,
                errorType: error instanceof Error ? error.constructor.name : 'unknown',
              });
              logger.warn({
                subject,
                attempt: error.attemptNumber,
                retriesLeft: error.retriesLeft,
                error: error.message || String(error),
              }, 'JetStream publish failed, retrying');
            }
          }
        );
      });
    } finally {
      clearTimeout(timeoutId);
    }
    
    const duration = Date.now() - startTime;
    jetstreamPublishLatency.record(duration, { subject });
    jetstreamPublishSuccess.add(1, { subject });
    
    logger.debug({ subject, bytes: binary.length, correlationId: event.correlationId }, 'Published to JetStream');
    return { ok: true };
  } catch (err) {
    const duration = Date.now() - startTime;
    jetstreamPublishLatency.record(duration, { subject });
    
    const classified = classifyNatsError(err);
    jetstreamPublishErrors.add(1, { 
      subject, 
      errorType: classified.constructor.name 
    });
    
    logger.warn({ subject, error: classified }, 'JetStream publish failed (retried 3x)');
    return { ok: false, error: true };
  }
}
