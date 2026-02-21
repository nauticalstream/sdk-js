import { AckPolicy, DeliverPolicy } from 'nats';
/**
 * Default error classifier - retry everything (backward compatible)
 */
export const defaultErrorClassifier = (_error) => {
    return 'retry';
};
/**
 * Establish a resilient JetStream durable subscription.
 * Returns a cleanup function to stop consumption gracefully.
 *
 * Handler receives raw binary data (Uint8Array) for protobuf decoding
 */
export async function subscribe(client, logger, config) {
    const { stream, consumer: consumerName, subject, handler, concurrency = 1, retryDelayMs = 500 } = config;
    try {
        if (!client.connected) {
            logger.warn({ subject }, 'NATS not connected - cannot subscribe');
            return async () => { };
        }
        const js = client.getJetStream();
        logger.info({ stream, consumer: consumerName, subject }, 'Initializing JetStream consumer');
        const jsm = await client.getJetStreamManager();
        let consumer;
        try {
            await jsm.consumers.info(stream, consumerName);
            logger.debug({ consumer: consumerName }, 'Using existing consumer');
        }
        catch {
            logger.info({ consumer: consumerName }, 'Creating JetStream consumer');
            await jsm.consumers.add(stream, {
                name: consumerName,
                durable_name: consumerName,
                ack_policy: AckPolicy.Explicit,
                filter_subject: subject,
                deliver_policy: DeliverPolicy.All
            });
        }
        consumer = await js.consumers.get(stream, consumerName);
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
                // Pass raw binary data to handler for protobuf decoding
                const binaryData = msg.data;
                logger.debug({ subject: msg.subject, consumer: consumerName, bytes: binaryData.length }, 'Processing message');
                await handler(binaryData, msg);
                msg.ack();
                logger.debug({ subject: msg.subject, consumer: consumerName }, 'Message processed');
            }
            catch (err) {
                const classifier = config.errorClassifier || defaultErrorClassifier;
                const action = classifier(err);
                const errorName = err instanceof Error ? err.constructor.name : 'UnknownError';
                const errorMessage = err instanceof Error ? err.message : String(err);
                switch (action) {
                    case 'retry':
                        logger.error({ err, errorName, errorMessage, subject: msg.subject, consumer: consumerName }, 'Transient error - will retry after delay');
                        msg.nak(retryDelayMs);
                        break;
                    case 'discard':
                        logger.warn({ errorName, errorMessage, subject: msg.subject, consumer: consumerName }, 'Non-retryable error - discarding message');
                        msg.ack(); // ACK to remove from queue
                        break;
                    case 'deadletter':
                        logger.error({ err, errorName, errorMessage, subject: msg.subject, consumer: consumerName }, 'Fatal error - marking as poison message (deadletter)');
                        msg.term(); // Terminal error - requires manual intervention
                        break;
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
                if (!stopped) {
                    logger.error({ err }, 'JetStream consumer stopped unexpectedly');
                }
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
        logger.error({ err, stream: config.stream, consumer: config.consumer, subject: config.subject }, 'Failed to initialize consumer');
        return async () => { };
    }
}
//# sourceMappingURL=subscribe.js.map