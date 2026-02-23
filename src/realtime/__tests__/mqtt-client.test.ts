import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MQTTClientManager } from '../client/mqtt-client';

// ---------------------------------------------------------------------------
// Minimal mqtt mock
// ---------------------------------------------------------------------------

type EventHandler = (...args: unknown[]) => void;

function createMockMqttClient(connectImmediately = true, failConnect = false) {
  const handlers: Record<string, EventHandler[]> = {};

  const mockClient = {
    connected: false,
    publish: vi.fn((_t: string, _p: unknown, _o: unknown, cb: (e: Error | null) => void) => cb(null)),
    subscribe: vi.fn((_t: string[], _o: unknown, cb: (e: Error | null) => void) => cb(null)),
    endAsync: vi.fn(async () => { mockClient.connected = false; }),
    on(event: string, handler: EventHandler) {
      (handlers[event] ??= []).push(handler);
      return mockClient;
    },
    emit(event: string, ...args: unknown[]) {
      handlers[event]?.forEach(h => h(...args));
    },
  };

  if (connectImmediately) {
    // Simulate connect/error being called after next tick
    (mockClient as any)._triggerConnect = () => {
      if (failConnect) {
        mockClient.emit('error', new Error('ECONNREFUSED'));
      } else {
        mockClient.connected = true;
        mockClient.emit('connect');
      }
    };
  }

  return mockClient;
}

vi.mock('mqtt', () => {
  let _mockClient: ReturnType<typeof createMockMqttClient> | null = null;
  return {
    default: {
      connect: vi.fn(() => {
        _mockClient = createMockMqttClient();
        // Fire 'connect' asynchronously
        setTimeout(() => (_mockClient as any)._triggerConnect(), 0);
        return _mockClient;
      }),
      _getMockClient: () => _mockClient,
    },
  };
});

import mqtt from 'mqtt';

beforeEach(() => {
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// Bug 1 fix: isConnected() exists and reflects socket state
// ---------------------------------------------------------------------------
describe('MQTTClientManager.isConnected()', () => {
  it('returns false before connect()', () => {
    const mgr = new MQTTClientManager({ brokerUrl: 'mqtt://localhost:1883' });
    expect(mgr.isConnected()).toBe(false);
  });

  it('returns true after successful connect()', async () => {
    const mgr = new MQTTClientManager({ brokerUrl: 'mqtt://localhost:1883' });
    await mgr.connect();
    expect(mgr.isConnected()).toBe(true);
  });

  it('returns false after disconnect()', async () => {
    const mgr = new MQTTClientManager({ brokerUrl: 'mqtt://localhost:1883' });
    await mgr.connect();
    await mgr.disconnect();
    expect(mgr.isConnected()).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Bug 4 fix: concurrent connect() rejects when first attempt fails
// ---------------------------------------------------------------------------
describe('MQTTClientManager concurrent connect()', () => {
  it('second caller rejects when first connect fails', async () => {
    // Override mqtt.connect to return a client that immediately emits error
    (mqtt.connect as ReturnType<typeof vi.fn>).mockImplementationOnce(() => {
      const client = createMockMqttClient(false);
      setTimeout(() => client.emit('error', new Error('ECONNREFUSED')), 0);
      return client;
    });

    const mgr = new MQTTClientManager({ brokerUrl: 'mqtt://localhost:1883' });

    // Start two concurrent connect() calls
    const p1 = mgr.connect().catch(e => e);
    const p2 = mgr.connect().catch(e => e);

    const [r1, r2] = await Promise.all([p1, p2]);
    expect(r1).toBeInstanceOf(Error);
    expect(r2).toBeInstanceOf(Error);
  });

  it('second caller resolves when first connect succeeds', async () => {
    const mgr = new MQTTClientManager({ brokerUrl: 'mqtt://localhost:1883' });
    const [r1, r2] = await Promise.all([mgr.connect(), mgr.connect()]);
    // Both should resolve to the same MqttClient instance
    expect(r1).toBe(r2);
  });
});
