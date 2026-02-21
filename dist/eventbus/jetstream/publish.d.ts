import type { NatsClient } from '../client/nats-client';
import type { Logger } from 'pino';
import { type Message, type MessageInitShape } from '@bufbuild/protobuf';
import type { GenMessage } from '@bufbuild/protobuf/codegenv2';
import { type RetryConfig } from '../core/config';
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
export declare function publish<T extends Message>(client: NatsClient, logger: Logger, source: string, schema: GenMessage<T>, data: MessageInitShape<GenMessage<T>>, options?: JetStreamPublishOptions): Promise<{
    ok: boolean;
    error?: boolean;
}>;
//# sourceMappingURL=publish.d.ts.map