import type { NatsClient } from '../client/nats-client';
import type { Logger } from 'pino';
import type { Message } from '@bufbuild/protobuf';
import type { GenMessage } from '@bufbuild/protobuf/codegenv2';
import { type RetryConfig } from '../core/config';
/**
 * Publish to JetStream (persistent)
 * Safe publisher — returns { ok: true } on success or { ok: false, error: true } on failure.
 * Payload is automatically wrapped in a platform.v1.Event envelope.
 * Implements smart retry logic that distinguishes infrastructure errors from application errors.
 * Uses circuit breaker to prevent cascading failures when NATS cluster is unhealthy.
 *
 * @param retryConfig - Retry configuration. Uses defaults if not provided.
 */
export declare function publish<T extends Message>(client: NatsClient, logger: Logger, source: string, subject: string, schema: GenMessage<T>, data: T, correlationId?: string, retryConfig?: RetryConfig): Promise<{
    ok: boolean;
    error?: boolean;
}>;
//# sourceMappingURL=publish.d.ts.map