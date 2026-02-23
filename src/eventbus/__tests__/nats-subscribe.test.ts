import { describe, it, expect, vi, beforeEach } from 'vitest';
import { subscribe } from '../nats/subscribe';
import type { NatsClient } from '../client/nats-client';
import { EventSchema } from '@nauticalstream/proto/platform/v1/event_pb';
import { create, toJsonString } from '@bufbuild/protobuf';

function makeFakeMsg(binary: Uint8Array) {
  return {
    data: binary,
    headers: undefined,
  };
}

function makeClient(connected: boolean, subscribeImpl?: ReturnType<typeof vi.fn>): NatsClient {
  const sub = subscribeImpl ?? vi.fn().mockReturnValue({
    unsubscribe: vi.fn(),
  });
  return {
    connected,
    getConnection: () => ({ subscribe: sub }),
  } as any;
}

const mockLogger = { info: vi.fn(), error: vi.fn(), debug: vi.fn() } as any;
const schema = { typeName: 'workspace.v1.WorkspaceCreated' } as any;

beforeEach(() => vi.clearAllMocks());

describe('nats/subscribe', () => {
  it('throws when client is disconnected', async () => {
    await expect(
      subscribe(makeClient(false), mockLogger, schema, async () => {})
    ).rejects.toThrow('NATS not connected');
  });

  it('subscribes on the derived subject', async () => {
    const sub = vi.fn().mockReturnValue({ unsubscribe: vi.fn() });
    await subscribe(makeClient(true, sub), mockLogger, schema, async () => {});
    expect(sub).toHaveBeenCalledWith('workspace.v1.workspace-created', expect.any(Object));
  });

  it('returns an Unsubscribe function', async () => {
    const unsubscribe = vi.fn();
    const sub = vi.fn().mockReturnValue({ unsubscribe });
    const cleanup = await subscribe(makeClient(true, sub), mockLogger, schema, async () => {});
    expect(typeof cleanup).toBe('function');
    cleanup();
    expect(unsubscribe).toHaveBeenCalledOnce();
  });

  it('logs and does not throw when handler rejects', async () => {
    let capturedCallback: Function | undefined;
    const sub = vi.fn().mockImplementation((_subj, opts) => {
      capturedCallback = opts.callback;
      return { unsubscribe: vi.fn() };
    });

    await subscribe(makeClient(true, sub), mockLogger, schema, async () => {
      throw new Error('handler boom');
    });

    // Feed a properly-built envelope so parseEnvelope doesn't fail
    const evt = create(EventSchema, {
      type: 'workspace.v1.workspace-created',
      source: 'svc',
      correlationId: 'test-cid',
      timestamp: new Date().toISOString(),
    });
    const binary = new TextEncoder().encode(toJsonString(EventSchema, evt));
    await capturedCallback!(null, makeFakeMsg(binary));

    expect(mockLogger.error).toHaveBeenCalled();
  });
});
