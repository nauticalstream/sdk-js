import type { JsMsg, Consumer } from 'nats';
import type { Logger } from 'pino';
import type { NatsClient } from '../client/nats-client';
import { ensureConsumer } from './consumer';

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
export const defaultErrorClassifier: ErrorClassifier = () => 'retry';

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
export async function subscribe(
  client: NatsClient,
  logger: Logger,
  config: SubscriberConfig
): Promise<() => Promise<void>> {
  const {
    stream,
    consumer: consumerName,
    subject,
    handler,
    concurrency = 1,
    retryDelayMs = 500,
    errorClassifier = defaultErrorClassifier,
  } = config;

  if (!client.connected) {
    logger.warn({ subject }, 'NATS not connected — subscriber returning no-op');
    return async () => {};
  }

  try {
    const js = client.getJetStream();
    const jsm = await client.getJetStreamManager();

    logger.info({ stream, consumer: consumerName, subject }, 'Initialising JetStream consumer');

    const consumer: Consumer = await ensureConsumer(jsm, js, stream, consumerName, subject, {
      maxDeliveries: config.maxDeliveries,
    });
    const messages = await consumer.consume({ max_messages: 100 });

    let active = 0;
    const queue: JsMsg[] = [];
    let stopped = false;

    const processNext = async () => {
      if (active >= concurrency || stopped) return;
      const msg = queue.shift();
      if (!msg) return;

      active++;
      try {
        logger.debug({ subject: msg.subject, consumer: consumerName, bytes: msg.data.length }, 'Processing message');
        await handler(msg.data, msg);
        msg.ack();
      } catch (err) {
        const action = errorClassifier(err);
        const name = err instanceof Error ? err.constructor.name : 'UnknownError';
        const message = err instanceof Error ? err.message : String(err);

        if (action === 'retry') {
          logger.error({ err, name, message, subject: msg.subject, consumer: consumerName }, 'Transient error — will retry');
          msg.nak(retryDelayMs);
        } else if (action === 'discard') {
          logger.warn({ name, message, subject: msg.subject, consumer: consumerName }, 'Non-retryable error — discarding');
          msg.ack();
        } else {
          logger.error({ err, name, message, subject: msg.subject, consumer: consumerName }, 'Fatal error — dead-lettering');
          msg.term();
        }
      } finally {
        active--;
        void processNext();
      }
    };

    const loop = (async () => {
      try {
        for await (const msg of messages) {
          if (stopped) break;
          queue.push(msg);
          void processNext();
        }
      } catch (err) {
        if (!stopped) logger.error({ err }, 'JetStream consumer stopped unexpectedly');
      }
    })();

    logger.info({ stream, consumer: consumerName, subject }, 'JetStream consumer started');

    return async () => {
      try {
        stopped = true;
        await messages.close();
        await loop;
        logger.info({ consumer: consumerName }, 'JetStream consumer closed');
      } catch (err) {
        logger.error({ err }, 'Error during consumer shutdown');
      }
    };
  } catch (err) {
    logger.error({ err, stream, consumer: config.consumer, subject }, 'Failed to initialise consumer');
    return async () => {};
  }
}
