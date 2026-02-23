import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ensureConsumer } from '../jetstream/consumer';
import { AckPolicy, DeliverPolicy } from 'nats';

const mockGet = vi.fn();
const mockInfo = vi.fn();
const mockAdd = vi.fn();

const jsm = {
  consumers: { info: mockInfo, add: mockAdd },
} as any;

const js = {
  consumers: { get: mockGet },
} as any;

const STREAM = 'WORKSPACE';
const NAME = 'workspace-svc';
const SUBJECT = 'workspace.v1.workspace-created';

beforeEach(() => {
  vi.clearAllMocks();
  mockGet.mockResolvedValue({ name: NAME });
});

describe('ensureConsumer', () => {
  it('returns existing consumer when info() resolves', async () => {
    mockInfo.mockResolvedValue({ name: NAME });
    const consumer = await ensureConsumer(jsm, js, STREAM, NAME, SUBJECT);
    expect(mockAdd).not.toHaveBeenCalled();
    expect(mockGet).toHaveBeenCalledWith(STREAM, NAME);
    expect(consumer).toBeDefined();
  });

  it('creates consumer when info() throws', async () => {
    mockInfo.mockRejectedValue(new Error('consumer not found'));
    await ensureConsumer(jsm, js, STREAM, NAME, SUBJECT);
    expect(mockAdd).toHaveBeenCalledOnce();
  });

  it('passes correct durable_name to consumers.add()', async () => {
    mockInfo.mockRejectedValue(new Error('not found'));
    await ensureConsumer(jsm, js, STREAM, NAME, SUBJECT);
    const [, config] = mockAdd.mock.calls[0];
    expect(config.durable_name).toBe(NAME);
    expect(config.name).toBe(NAME);
  });

  it('passes correct filter_subject to consumers.add()', async () => {
    mockInfo.mockRejectedValue(new Error('not found'));
    await ensureConsumer(jsm, js, STREAM, NAME, SUBJECT);
    const [, config] = mockAdd.mock.calls[0];
    expect(config.filter_subject).toBe(SUBJECT);
  });

  it('uses AckPolicy.Explicit', async () => {
    mockInfo.mockRejectedValue(new Error('not found'));
    await ensureConsumer(jsm, js, STREAM, NAME, SUBJECT);
    const [, config] = mockAdd.mock.calls[0];
    expect(config.ack_policy).toBe(AckPolicy.Explicit);
  });

  it('uses DeliverPolicy.All', async () => {
    mockInfo.mockRejectedValue(new Error('not found'));
    await ensureConsumer(jsm, js, STREAM, NAME, SUBJECT);
    const [, config] = mockAdd.mock.calls[0];
    expect(config.deliver_policy).toBe(DeliverPolicy.All);
  });

  it('sets max_deliver when maxDeliveries is provided', async () => {
    mockInfo.mockRejectedValue(new Error('not found'));
    await ensureConsumer(jsm, js, STREAM, NAME, SUBJECT, { maxDeliveries: 3 });
    const [, config] = mockAdd.mock.calls[0];
    expect(config.max_deliver).toBe(3);
  });
});
