import type { NatsClient } from '../client/nats-client';
import type { Logger } from 'pino';
import type { JsMsg } from 'nats';
/**
 * Error handling actions for JetStream messages
 * - retry: NAK the message for redelivery (transient errors like network/DB timeouts)
 * - discard: ACK the message to remove from queue (logic errors like validation failures)
 * - deadletter: TERM the message to mark as poison (critical errors needing manual intervention)
 */
export type ErrorAction = 'retry' | 'discard' | 'deadletter';
/**
 * Error classifier function - determines how to handle errors
 */
export type ErrorClassifier = (error: unknown) => ErrorAction;
/**
 * Default error classifier - retry everything (backward compatible)
 */
export declare const defaultErrorClassifier: ErrorClassifier;
/**
 * JetStream subscriber configuration
 * Handler receives raw binary data (Uint8Array) for protobuf decoding
 */
export interface SubscriberConfig {
    stream: string;
    consumer: string;
    subject: string;
    handler: (data: Uint8Array, msg: JsMsg) => Promise<void>;
    concurrency?: number;
    retryDelayMs?: number;
    /**
     * Optional error classifier to determine retry behavior
     * Defaults to retrying all errors if not provided
     */
    errorClassifier?: ErrorClassifier;
}
/**
 * Establish a resilient JetStream durable subscription.
 * Returns a cleanup function to stop consumption gracefully.
 *
 * Handler receives raw binary data (Uint8Array) for protobuf decoding
 */
export declare function subscribe(client: NatsClient, logger: Logger, config: SubscriberConfig): Promise<() => Promise<void>>;
//# sourceMappingURL=subscribe.d.ts.map