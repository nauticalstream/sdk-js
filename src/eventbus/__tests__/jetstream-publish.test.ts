import { describe, it, expect, vi, beforeEach } from 'vitest';
import { publish } from '../jetstream/publish';
import type { NatsClient } from '../client/nats-client';

vi.mock('../envelope', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../envelope')>();
  return {
    ...actual,
    buildEnvelope: vi.fn().mockImplementation((_source, _schema, _data, options) => {
      const subject = options?.subject ?? 'workspace.v1.workspace-created';
      return {
        event: { correlationId: 'cid-1', type: subject },
        payload: `{"type":"${subject}"}`,
        headers: {},
      };
    }),
  };
});

const mockJsPublish = vi.fn();
const mockGetJetStream = vi.fn().mockReturnValue({ publish: mockJsPublish });

function makeClient(connected: boolean): NatsClient {
  return { connected, getJetStream: mockGetJetStream } as any;
}

const mockLogger = { debug: vi.fn(), warn: vi.fn(), error: vi.fn(), info: vi.fn() } as any;
const schema = { typeName: 'workspace.v1.WorkspaceCreated' } as any;

beforeEach(() => {
  vi.clearAllMocks();
  mockJsPublish.mockResolvedValue({ seq: 1 });
});

describe('jetstream/publish', () => {
  it('returns { ok: true } on success', async () => {
    const result = await publish(makeClient(true), mockLogger, 'svc', schema, {});
    expect(result).toEqual({ ok: true });
  });

  it('calls js.publish with the derived subject', async () => {
    await publish(makeClient(true), mockLogger, 'svc', schema, {});
    expect(mockJsPublish).toHaveBeenCalledOnce();
    const [subject] = mockJsPublish.mock.calls[0];
    expect(subject).toBe('workspace.v1.workspace-created');
  });

  it('uses custom subject when provided in options', async () => {
    await publish(makeClient(true), mockLogger, 'svc', schema, {}, { subject: 'custom.subject' });
    const [subject] = mockJsPublish.mock.calls[0];
    expect(subject).toBe('custom.subject');
  });

  it('returns { ok: false, error: true } when js.publish rejects', async () => {
    mockJsPublish.mockRejectedValue(new Error('disconnected'));
    const result = await publish(makeClient(true), mockLogger, 'svc', schema, {});
    expect(result).toEqual({ ok: false, error: true });
  });

  it('does not throw when js.publish rejects', async () => {
    mockJsPublish.mockRejectedValue(new Error('boom'));
    await expect(publish(makeClient(true), mockLogger, 'svc', schema, {})).resolves.not.toThrow();
  });
});
