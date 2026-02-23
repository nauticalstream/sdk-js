import { describe, it, expect, vi, beforeEach } from 'vitest';
import { publish } from '../nats/publish';
import { buildEnvelope } from '../envelope';
import type { NatsClient } from '../client/nats-client';

vi.mock('../envelope', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../envelope')>();
  return {
    ...actual,
    buildEnvelope: vi.fn().mockReturnValue({
      event: { correlationId: 'cid-1' },
      binary: new Uint8Array([1, 2, 3]),
      headers: {},
    }),
  };
});

const mockPublish = vi.fn();
const mockGetConnection = vi.fn().mockReturnValue({ publish: mockPublish });

function makeClient(connected: boolean): NatsClient {
  return { connected, getConnection: mockGetConnection } as any;
}

const mockLogger = { debug: vi.fn(), error: vi.fn() } as any;
const schema = { typeName: 'workspace.v1.WorkspaceCreated' } as any;

beforeEach(() => vi.clearAllMocks());

describe('nats/publish', () => {
  it('calls connection.publish with correct subject and binary', async () => {
    await publish(makeClient(true), mockLogger, 'svc', schema, {});
    expect(mockPublish).toHaveBeenCalledOnce();
    const [subject, binary] = mockPublish.mock.calls[0];
    expect(subject).toBe('workspace.v1.workspace-created');
    expect(binary).toBeInstanceOf(Uint8Array);
  });

  it('throws when client is not connected', async () => {
    await expect(publish(makeClient(false), mockLogger, 'svc', schema, {})).rejects.toThrow(
      'NATS not connected'
    );
    expect(mockPublish).not.toHaveBeenCalled();
  });

  it('propagates custom correlationId into buildEnvelope', async () => {
    await publish(makeClient(true), mockLogger, 'svc', schema, {}, { correlationId: 'custom-cid' });
    const callArgs = (buildEnvelope as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(callArgs[4]).toBe('custom-cid');
  });
});
