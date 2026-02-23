import { type Message, type MessageInitShape } from '@bufbuild/protobuf';
import type { GenMessage } from '@bufbuild/protobuf/codegenv2';
import type { Logger } from 'pino';
import type { NatsClient } from '../client/nats-client';
import { type RetryConfig } from '../config';
export interface JetStreamPublishOptions {
    /** Override the auto-derived subject. */
    subject?: string;
    /** Correlation ID for tracing. */
    correlationId?: string;
    /** Override default retry configuration. */
    retryConfig?: RetryConfig;
}
/**
 * Publish a proto message to JetStream (persistent, at-least-once).
 * Wraps the message in a platform.v1.Event envelope, then publishes with
 * retry, circuit breaker, timeout, and OTel metrics.
 *
 * Returns { ok: true } on success or { ok: false, error: true } on final failure
 * so callers can decide whether to surface the error without an uncaught exception.
 */
export declare function publish<T extends Message>(client: NatsClient, logger: Logger, source: string, schema: GenMessage<T>, data: MessageInitShape<GenMessage<T>>, options?: JetStreamPublishOptions): Promise<{
    ok: boolean;
    error?: boolean;
}>;
/**
 * Reset a JetStream publish circuit breaker.
 * @param domain - Subject domain prefix (first segment), e.g. 'workspace', 'agency'.
 *                 Breaker key is `nats-${domain}`, so pass the full key if needed.
 * @example resetBreaker('workspace')  // resets nats-workspace
 */
export declare function resetBreaker(domain: string): void;
//# sourceMappingURL=publish.d.ts.map