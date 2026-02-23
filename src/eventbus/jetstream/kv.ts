import type { KV, ObjectStore } from 'nats';
import type { Logger } from 'pino';
import type { NatsClient } from '../client/nats-client';

/**
 * Returns true only for genuine "bucket / stream not found" NATS errors.
 * Auth failures, network timeouts, and other infrastructure errors are re-thrown
 * so callers get the real error rather than a misleading "creating bucket" path.
 */
function isBucketNotFound(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  const msg = err.message.toLowerCase();
  // NATS.js surfaces 404s as messages containing 'not found' or 'stream not found'
  return msg.includes('not found') || msg.includes('404');
}

/**
 * Return an existing JetStream Key-Value bucket or create it.
 * The underlying stream is named KV_{bucketName}.
 */
export async function getKvBucket(client: NatsClient, bucketName: string, logger: Logger): Promise<KV> {
  const js = client.getJetStream();
  try {
    return await js.views.kv(bucketName);
  } catch (err) {
    if (!isBucketNotFound(err)) throw err;
    logger.info({ bucket: bucketName }, 'Creating KV bucket');
    const jsm = await client.getJetStreamManager();
    await jsm.streams.add({ name: `KV_${bucketName}`, subjects: [`$KV.${bucketName}.>`] });
    return js.views.kv(bucketName);
  }
}

/**
 * Return an existing JetStream Object Store bucket or create it.
 * The underlying stream is named OBJ_{bucketName}.
 */
export async function getObjectStore(client: NatsClient, bucketName: string, logger: Logger): Promise<ObjectStore> {
  const js = client.getJetStream();
  try {
    return await js.views.os(bucketName);
  } catch (err) {
    if (!isBucketNotFound(err)) throw err;
    logger.info({ bucket: bucketName }, 'Creating object store bucket');
    const jsm = await client.getJetStreamManager();
    await jsm.streams.add({ name: `OBJ_${bucketName}`, subjects: [`$O.${bucketName}.>`] });
    return js.views.os(bucketName);
  }
}
