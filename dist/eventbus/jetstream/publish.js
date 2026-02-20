"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.publish = publish;
const p_retry_1 = __importDefault(require("p-retry"));
const errors_1 = require("../errors");
const envelope_1 = require("../core/envelope");
const metrics_1 = require("../core/metrics");
const circuit_breaker_1 = require("../core/circuit-breaker");
const config_1 = require("../core/config");
/**
 * Publish to JetStream (persistent)
 * Safe publisher — returns { ok: true } on success or { ok: false, error: true } on failure.
 * Payload is automatically wrapped in a platform.v1.Event envelope.
 * Implements smart retry logic that distinguishes infrastructure errors from application errors.
 * Uses circuit breaker to prevent cascading failures when NATS cluster is unhealthy.
 *
 * @param retryConfig - Retry configuration. Uses defaults if not provided.
 */
async function publish(client, logger, source, subject, schema, data, correlationId, retryConfig) {
    const startTime = Date.now();
    metrics_1.jetstreamPublishAttempts.add(1, { subject });
    // Fast-fail if NATS cluster circuit breaker is open (known degradation)
    const serverCluster = 'nats-default';
    if ((0, circuit_breaker_1.isBreakerOpen)(serverCluster)) {
        metrics_1.jetstreamPublishErrors.add(1, {
            subject,
            errorType: 'CircuitBreakerOpenError'
        });
        logger.warn({ subject }, 'NATS circuit breaker is open, rejecting publish');
        return { ok: false, error: true };
    }
    try {
        const js = client.getJetStream();
        const { binary, event, headers } = (0, envelope_1.buildEnvelope)(source, subject, schema, data, correlationId);
        const config = { ...config_1.DEFAULT_RETRY_CONFIG, ...retryConfig };
        const breaker = (0, circuit_breaker_1.getOrCreateBreaker)(serverCluster, logger);
        // Create abort controller for operation timeout
        const abortController = new AbortController();
        const timeoutId = setTimeout(() => abortController.abort(), config.operationTimeout);
        try {
            // Publish with automatic retry on transient connection failures
            // Wrapped in circuit breaker to track failures and open on threshold
            await breaker.fire(async () => {
                return (0, p_retry_1.default)(() => js.publish(subject, binary, { headers }), {
                    retries: config.maxRetries,
                    minTimeout: config.initialDelayMs,
                    maxTimeout: config.maxDelayMs,
                    factor: config.backoffFactor,
                    signal: abortController.signal,
                    shouldRetry: (error) => (0, errors_1.shouldRetry)(logger, subject, (0, errors_1.classifyNatsError)(error)),
                    onFailedAttempt: (error) => {
                        metrics_1.jetstreamRetryAttempts.add(1, {
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
                });
            });
        }
        finally {
            clearTimeout(timeoutId);
        }
        const duration = Date.now() - startTime;
        metrics_1.jetstreamPublishLatency.record(duration, { subject });
        metrics_1.jetstreamPublishSuccess.add(1, { subject });
        logger.debug({ subject, bytes: binary.length, correlationId: event.correlationId }, 'Published to JetStream');
        return { ok: true };
    }
    catch (err) {
        const duration = Date.now() - startTime;
        metrics_1.jetstreamPublishLatency.record(duration, { subject });
        const classified = (0, errors_1.classifyNatsError)(err);
        metrics_1.jetstreamPublishErrors.add(1, {
            subject,
            errorType: classified.constructor.name
        });
        logger.warn({ subject, error: classified }, 'JetStream publish failed (retried 3x)');
        return { ok: false, error: true };
    }
}
//# sourceMappingURL=publish.js.map