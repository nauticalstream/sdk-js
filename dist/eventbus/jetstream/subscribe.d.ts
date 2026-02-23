import type { JsMsg } from 'nats';
import type { Logger } from 'pino';
import type { NatsClient } from '../client/nats-client';
/**
 * What to do with a message after handler failure.
 *
 * - retry       NAK for redelivery — use for transient errors (network, DB timeout)
 * - discard     ACK + remove — use for permanent logic errors (validation, bad schema)
 * - deadletter  TERM — marks the message as poison, requires manual intervention
 */
export type ErrorAction = 'retry' | 'discard' | 'deadletter';
/** Classify an error into an ErrorAction. */
export type ErrorClassifier = (error: unknown) => ErrorAction;
/** Default classifier — always retry. Safe for unknown error types. */
export declare const defaultErrorClassifier: ErrorClassifier;
export interface SubscriberConfig {
    stream: string;
    consumer: string;
    subject: string;
    /** Receives raw bytes — decode them with parseEnvelope + fromJson inside the handler. */
    handler: (data: Uint8Array, msg: JsMsg) => Promise<void>;
    concurrency?: number;
    retryDelayMs?: number;
    /** Max delivery attempts before NATS dead-letters the message. */
    maxDeliveries?: number;
    errorClassifier?: ErrorClassifier;
}
/**
 * Low-level JetStream message loop.
 * Delivers raw Uint8Array to the handler; ACK/NAK/TERM based on error classifier.
 * Returns an async cleanup function — await it to drain the consumer gracefully.
 *
 * Upper layers (JetStreamAPI.subscribe) call this and wrap it with proto decode logic.
 */
export declare function subscribe(client: NatsClient, logger: Logger, config: SubscriberConfig): Promise<() => Promise<void>>;
//# sourceMappingURL=subscribe.d.ts.map