import type { NatsClient } from '../client/nats-client';
import type { Logger } from 'pino';
import { type Message, type MessageInitShape } from '@bufbuild/protobuf';
import type { GenMessage } from '@bufbuild/protobuf/codegenv2';
import { type RetryConfig } from '../core/config';
export interface JetStreamPublishOptions {
    correlationId?: string;
    subject?: string;
    retryConfig?: RetryConfig;
}
/** Publish to JetStream with retry, circuit breaker and timeout */
export declare function publish<T extends Message>(client: NatsClient, logger: Logger, source: string, schema: GenMessage<T>, data: MessageInitShape<GenMessage<T>>, options?: JetStreamPublishOptions): Promise<{
    ok: boolean;
    error?: boolean;
}>;
//# sourceMappingURL=publish.d.ts.map