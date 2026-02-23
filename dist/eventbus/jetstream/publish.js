import { buildEnvelope } from '../envelope';
import { classifyNatsError } from '../errors/classify';
import { jetstreamPublishLatency, jetstreamPublishSuccess, jetstreamPublishAttempts, jetstreamRetryAttempts, jetstreamPublishErrors, jetstreamCircuitBreakerState, } from '../observability/metrics';
import { resilientOperation, getOrCreateCircuitBreaker, shouldRetry, DEFAULT_CIRCUIT_BREAKER_CONFIG } from '../../resilience';
import { DEFAULT_RETRY_CONFIG } from '../config';
import { deriveSubject } from '../utils/derive-subject';
import { resetCircuitBreaker } from '../../resilience';
/**
 * Per-domain circuit breakers for JetStream publishes.
 * Keyed by the first subject segment (e.g. 'workspace', 'agency') so a slow
 * stream can't trip the breaker for unrelated domains.
 */
function getBreaker(domain) {
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
export async function publish(client, logger, source, schema, data, options) {
    const subject = options?.subject ?? deriveSubject(schema.typeName);
    const config = { ...DEFAULT_RETRY_CONFIG, ...options?.retryConfig };
    jetstreamPublishAttempts.add(1, { subject });
    try {
        const js = client.getJetStream();
        const { binary, event, headers } = buildEnvelope(source, subject, schema, data, options?.correlationId);
        await resilientOperation(() => js.publish(subject, binary, { headers }), {
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
        });
        logger.debug({ subject, bytes: binary.length, correlationId: event.correlationId }, 'Published to JetStream');
        return { ok: true };
    }
    catch (err) {
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
export function resetBreaker(domain) {
    resetCircuitBreaker(`nats-${domain}`);
}
//# sourceMappingURL=publish.js.map