import { describe, it, expect, vi, beforeEach } from 'vitest';
import { reply } from '../nats/reply';
import { parseEnvelope } from '../envelope';
import type { NatsClient } from '../client/nats-client';
import { EventSchema } from '@nauticalstream/proto/platform/v1/event_pb';
import { create, toJsonString } from '@bufbuild/protobuf';

function makeEventBinary(type: string, source: string, correlationId?: string): Uint8Array {
  const evt = create(EventSchema, {
    type,
    source,
    correlationId: correlationId ?? 'test-cid',
    timestamp: new Date().toISOString(),
  });
  return new TextEncoder().encode(toJsonString(EventSchema, evt));
}

function makeClient(
  connected: boolean,
  subscribeImpl?: ReturnType<typeof vi.fn>
): NatsClient {
  const sub = subscribeImpl ?? vi.fn().mockReturnValue({ unsubscribe: vi.fn() });
  return { connected, getConnection: () => ({ subscribe: sub }) } as any;
}

const mockLogger = { info: vi.fn(), error: vi.fn(), debug: vi.fn(), warn: vi.fn() } as any;
const reqSchema = { typeName: 'workspace.v1.GetWorkspaceRequest' } as any;
const resSchema = { typeName: 'workspace.v1.GetWorkspaceResponse' } as any;

beforeEach(() => vi.clearAllMocks());

describe('nats/reply', () => {
  it('throws when disconnected', async () => {
    await expect(
      reply(makeClient(false), mockLogger, {
        source: 'svc',
        reqSchema,
        respSchema: resSchema,
        handler: async () => ({}),
      })
    ).rejects.toThrow('NATS not connected');
  });

  it('subscribes on the derived subject', async () => {
    const sub = vi.fn().mockReturnValue({ unsubscribe: vi.fn() });
    await reply(makeClient(true, sub), mockLogger, {
      source: 'svc',
      reqSchema,
      respSchema: resSchema,
      handler: async () => ({}),
    });
    expect(sub).toHaveBeenCalledWith('workspace.v1.get-workspace-request', expect.any(Object));
  });

  it('sends an error event (no data) when handler throws', async () => {
    let capturedCallback: Function | undefined;
    const mockRespond = vi.fn();

    const sub = vi.fn().mockImplementation((_subj, opts) => {
      capturedCallback = opts.callback;
      return { unsubscribe: vi.fn() };
    });

    await reply(makeClient(true, sub), mockLogger, {
      source: 'svc',
      reqSchema,
      respSchema: resSchema,
      handler: async () => { throw new Error('handler fail'); },
    });

    const binary = makeEventBinary('workspace.v1.get-workspace-request', 'svc');
    await capturedCallback!(null, { data: binary, headers: undefined, respond: mockRespond });

    expect(mockRespond).toHaveBeenCalledOnce();
    // Decode the error response and verify data is absent
    const errorEvent = parseEnvelope(mockRespond.mock.calls[0][0]);
    expect(errorEvent.data).toBeFalsy();
  });

  it('echoes the inbound correlationId in the error event', async () => {
    let capturedCallback: Function | undefined;
    const mockRespond = vi.fn();
    const sub = vi.fn().mockImplementation((_subj, opts) => {
      capturedCallback = opts.callback;
      return { unsubscribe: vi.fn() };
    });

    await reply(makeClient(true, sub), mockLogger, {
      source: 'svc',
      reqSchema,
      respSchema: resSchema,
      handler: async () => { throw new Error('boom'); },
    });

    const binary = makeEventBinary('workspace.v1.get-workspace-request', 'svc', 'inbound-cid');
    await capturedCallback!(null, { data: binary, headers: undefined, respond: mockRespond });

    const errorEvent = parseEnvelope(mockRespond.mock.calls[0][0]);
    expect(errorEvent.correlationId).toBe('inbound-cid');
  });
});
