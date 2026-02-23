import { ensureConsumer } from './consumer';
/** Default classifier — always retry. Safe for unknown error types. */
export const defaultErrorClassifier = () => 'retry';
/**
 * Low-level JetStream message loop.
 * Delivers raw Uint8Array to the handler; ACK/NAK/TERM based on error classifier.
 * Returns an async cleanup function — await it to drain the consumer gracefully.
 *
 * Upper layers (JetStreamAPI.subscribe) call this and wrap it with proto decode logic.
 */
export async function subscribe(client, logger, config) {
    const { stream, consumer: consumerName, subject, handler, concurrency = 1, retryDelayMs = 500, errorClassifier = defaultErrorClassifier, } = config;
    if (!client.connected) {
        logger.warn({ subject }, 'NATS not connected — subscriber returning no-op');
        return async () => { };
    }
    try {
        const js = client.getJetStream();
        const jsm = await client.getJetStreamManager();
        logger.info({ stream, consumer: consumerName, subject }, 'Initialising JetStream consumer');
        const consumer = await ensureConsumer(jsm, js, stream, consumerName, subject, {
            maxDeliveries: config.maxDeliveries,
        });
        const messages = await consumer.consume({ max_messages: 100 });
        let active = 0;
        const queue = [];
        let stopped = false;
        const processNext = async () => {
            if (active >= concurrency || stopped)
                return;
            const msg = queue.shift();
            if (!msg)
                return;
            active++;
            try {
                logger.debug({ subject: msg.subject, consumer: consumerName, bytes: msg.data.length }, 'Processing message');
                await handler(msg.data, msg);
                msg.ack();
            }
            catch (err) {
                const action = errorClassifier(err);
                const name = err instanceof Error ? err.constructor.name : 'UnknownError';
                const message = err instanceof Error ? err.message : String(err);
                if (action === 'retry') {
                    logger.error({ err, name, message, subject: msg.subject, consumer: consumerName }, 'Transient error — will retry');
                    msg.nak(retryDelayMs);
                }
                else if (action === 'discard') {
                    logger.warn({ name, message, subject: msg.subject, consumer: consumerName }, 'Non-retryable error — discarding');
                    msg.ack();
                }
                else {
                    logger.error({ err, name, message, subject: msg.subject, consumer: consumerName }, 'Fatal error — dead-lettering');
                    msg.term();
                }
            }
            finally {
                active--;
                void processNext();
            }
        };
        const loop = (async () => {
            try {
                for await (const msg of messages) {
                    if (stopped)
                        break;
                    queue.push(msg);
                    void processNext();
                }
            }
            catch (err) {
                if (!stopped)
                    logger.error({ err }, 'JetStream consumer stopped unexpectedly');
            }
        })();
        logger.info({ stream, consumer: consumerName, subject }, 'JetStream consumer started');
        return async () => {
            try {
                stopped = true;
                await messages.close();
                await loop;
                logger.info({ consumer: consumerName }, 'JetStream consumer closed');
            }
            catch (err) {
                logger.error({ err }, 'Error during consumer shutdown');
            }
        };
    }
    catch (err) {
        logger.error({ err, stream, consumer: config.consumer, subject }, 'Failed to initialise consumer');
        return async () => { };
    }
}
//# sourceMappingURL=subscribe.js.map