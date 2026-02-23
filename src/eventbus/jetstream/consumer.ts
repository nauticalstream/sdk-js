import type { Consumer, JetStreamClient } from 'nats';
import { AckPolicy, DeliverPolicy } from 'nats';

type JetStreamManager = Awaited<ReturnType<import('../client/nats-client').NatsClient['getJetStreamManager']>>;

export interface ConsumerOptions {
  maxDeliveries?: number;
}

export interface EphemeralConsumerOptions {
  startTime?: number;
  startSequence?: number;
}

/**
 * Return an existing durable consumer or create it if absent.
 * Uses jsm.consumers.info() as an existence probe — creates on NotFound.
 *
 * @param jsm      JetStream manager
 * @param stream   Stream name
 * @param name     Durable consumer name
 * @param subject  Filter subject (must match a subject in the stream)
 * @param opts     Optional overrides (maxDeliveries)
 */
export async function ensureConsumer(
  jsm: JetStreamManager,
  js: JetStreamClient,
  stream: string,
  name: string,
  subject: string,
  opts: ConsumerOptions = {}
): Promise<Consumer> {
  try {
    await jsm.consumers.info(stream, name);
  } catch {
    await jsm.consumers.add(stream, {
      name,
      durable_name: name,
      ack_policy: AckPolicy.Explicit,
      filter_subject: subject,
      deliver_policy: DeliverPolicy.All,
      ...(opts.maxDeliveries !== undefined && { max_deliver: opts.maxDeliveries }),
    });
  }

  return js.consumers.get(stream, name);
}

/**
 * Create a fresh ephemeral consumer for stream replay.
 * Never durable — deleted on cleanup via jsm.consumers.delete().
 *
 * @param jsm            JetStream manager
 * @param stream         Stream name
 * @param subject        Filter subject
 * @param opts.startTime Unix timestamp ms — deliver from this point
 * @param opts.startSequence Sequence number — deliver from this sequence
 */
export async function ensureEphemeralConsumer(
  jsm: JetStreamManager,
  js: JetStreamClient,
  stream: string,
  subject: string,
  opts: EphemeralConsumerOptions = {}
): Promise<{ consumer: Consumer; name: string }> {
  const name = `replay-${Date.now()}`;

  let deliverPolicy = DeliverPolicy.All;
  const consumerConfig: Record<string, unknown> = {
    name,
    ack_policy: AckPolicy.Explicit,
    filter_subject: subject,
  };

  if (opts.startTime) {
    deliverPolicy = DeliverPolicy.StartTime;
    consumerConfig.opt_start_time = new Date(opts.startTime).toISOString();
  } else if (opts.startSequence) {
    deliverPolicy = DeliverPolicy.StartSequence;
    consumerConfig.opt_start_seq = opts.startSequence;
  }

  consumerConfig.deliver_policy = deliverPolicy;

  await jsm.consumers.add(stream, consumerConfig as Parameters<typeof jsm.consumers.add>[1]);
  const consumer = await js.consumers.get(stream, name);
  return { consumer, name };
}
