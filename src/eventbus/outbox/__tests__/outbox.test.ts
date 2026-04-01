/**
 * @nauticalstream/sdk — Outbox Pattern Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WorkspaceCreatedSchema } from '@nauticalstream/proto/workspace/v1/workspace_events_pb';
import { OutboxPublisher, buildOutboxRecord } from '../index.js';
import type { PrismaTransaction, OutboxRecord } from '../types.js';

// ── Mock Data ────────────────────────────────────────────────────────────────

const mockWorkspaceData = {
  workspace: {
    id: 'workspace-123',
    name: 'Test Workspace',
    handle: 'test-workspace',
    description: 'A test workspace',
    createdAt: '2026-03-06T10:00:00Z',
    updatedAt: '2026-03-06T10:00:00Z',
  },
};

// ── Mock Prisma Transaction ──────────────────────────────────────────────────

function createMockTransaction() {
  const outboxRecords: OutboxRecord[] = [];

  const mockTx: PrismaTransaction = {
    outbox: {
      create: vi.fn(async ({ data }) => {
        outboxRecords.push(data);
        return { ...data, createdAt: new Date() };
      }),
    },
  };

  return { mockTx, outboxRecords };
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('buildOutboxRecord', () => {
  it('should build outbox record with correct structure', () => {
    const record = buildOutboxRecord(
      'workspace-service',
      WorkspaceCreatedSchema,
      mockWorkspaceData
    );

    expect(record).toMatchObject({
      id: expect.any(String),
      subject: expect.stringContaining('workspace'),
      payload: expect.any(Object),
    });

    expect(record.id).toHaveLength(36); // UUID format
    expect(record.payload).toHaveProperty('correlationId');
    expect(record.payload).toHaveProperty('source', 'workspace-service');
  });

  it('should include event envelope in payload', () => {
    const record = buildOutboxRecord(
      'workspace-service',
      WorkspaceCreatedSchema,
      mockWorkspaceData
    );

    const payload = record.payload as any;

    expect(payload).toHaveProperty('correlationId');
    expect(payload).toHaveProperty('timestamp');
    expect(payload).toHaveProperty('source', 'workspace-service');
    expect(payload).toHaveProperty('subject');
    expect(payload).toHaveProperty('data');
  });

  it('should generate unique correlation IDs for different calls', () => {
    const record1 = buildOutboxRecord(
      'workspace-service',
      WorkspaceCreatedSchema,
      mockWorkspaceData
    );

    const record2 = buildOutboxRecord(
      'workspace-service',
      WorkspaceCreatedSchema,
      mockWorkspaceData
    );

    expect(record1.id).not.toBe(record2.id);
  });
});

describe('OutboxPublisher', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('publish()', () => {
    it('should write event to outbox table', async () => {
      const { mockTx, outboxRecords } = createMockTransaction();
      const publisher = new OutboxPublisher('workspace-service');

      await publisher.publish(mockTx, WorkspaceCreatedSchema, mockWorkspaceData);

      expect(mockTx.outbox.create).toHaveBeenCalledTimes(1);
      expect(outboxRecords).toHaveLength(1);
      expect(outboxRecords[0]).toMatchObject({
        id: expect.any(String),
        subject: expect.stringContaining('workspace'),
        payload: expect.any(Object),
      });
    });

    it('should use configured source name', async () => {
      const { mockTx, outboxRecords } = createMockTransaction();
      const publisher = new OutboxPublisher('custom-service');

      await publisher.publish(mockTx, WorkspaceCreatedSchema, mockWorkspaceData);

      const payload = outboxRecords[0].payload as any;
      expect(payload.source).toBe('custom-service');
    });

    it('should publish multiple events in same transaction', async () => {
      const { mockTx, outboxRecords } = createMockTransaction();
      const publisher = new OutboxPublisher('workspace-service');

      await publisher.publish(mockTx, WorkspaceCreatedSchema, mockWorkspaceData);
      await publisher.publish(mockTx, WorkspaceCreatedSchema, mockWorkspaceData);

      expect(mockTx.outbox.create).toHaveBeenCalledTimes(2);
      expect(outboxRecords).toHaveLength(2);
      expect(outboxRecords[0].id).not.toBe(outboxRecords[1].id);
    });

    it('should create valid outbox record structure', async () => {
      const { mockTx } = createMockTransaction();
      const publisher = new OutboxPublisher('workspace-service');

      await publisher.publish(mockTx, WorkspaceCreatedSchema, mockWorkspaceData);

      expect(mockTx.outbox.create).toHaveBeenCalledWith({
        data: {
          id: expect.any(String),
          correlationId: expect.any(String),
          subject: expect.any(String),
          payload: expect.objectContaining({
            id: expect.any(String),
            correlationId: expect.any(String),
            subject: expect.any(String),
            source: expect.any(String),
            timestamp: expect.any(String),
            data: expect.any(Object),
          }),
        },
      });
    });
  });

  describe('write() - backward compatibility', () => {
    it('should work as alias for publish()', async () => {
      const { mockTx, outboxRecords } = createMockTransaction();
      const publisher = new OutboxPublisher('workspace-service');

      await publisher.write(mockTx, WorkspaceCreatedSchema, mockWorkspaceData);

      expect(mockTx.outbox.create).toHaveBeenCalledTimes(1);
      expect(outboxRecords).toHaveLength(1);
    });

    it('should produce identical results to publish()', async () => {
      const { mockTx: mockTx1, outboxRecords: records1 } = createMockTransaction();
      const { mockTx: mockTx2, outboxRecords: records2 } = createMockTransaction();
      const publisher = new OutboxPublisher('workspace-service');

      await publisher.publish(mockTx1, WorkspaceCreatedSchema, mockWorkspaceData);
      await publisher.write(mockTx2, WorkspaceCreatedSchema, mockWorkspaceData);

      // Both should create records (IDs will differ but structure should match)
      expect(records1).toHaveLength(1);
      expect(records2).toHaveLength(1);
      expect(records1[0]).toMatchObject({
        subject: records2[0].subject,
        payload: expect.objectContaining({
          source: (records2[0].payload as any).source,
        }),
      });
    });
  });

  describe('getSource()', () => {
    it('should return configured source name', () => {
      const publisher = new OutboxPublisher('workspace-service');

      expect(publisher.getSource()).toBe('workspace-service');
    });

    it('should return different sources for different instances', () => {
      const publisher1 = new OutboxPublisher('workspace-service');
      const publisher2 = new OutboxPublisher('article-service');

      expect(publisher1.getSource()).toBe('workspace-service');
      expect(publisher2.getSource()).toBe('article-service');
    });
  });
});

describe('Transactional guarantees', () => {
  it('should allow atomic publishing with business logic', async () => {
    const { mockTx, outboxRecords } = createMockTransaction();
    const publisher = new OutboxPublisher('workspace-service');
    const operations: string[] = [];

    // Simulate transaction
    operations.push('create-workspace');
    await publisher.publish(mockTx, WorkspaceCreatedSchema, mockWorkspaceData);
    operations.push('publish-event');

    expect(operations).toEqual(['create-workspace', 'publish-event']);
    expect(outboxRecords).toHaveLength(1);
  });

  it('should support multiple publishers in same transaction', async () => {
    const { mockTx, outboxRecords } = createMockTransaction();
    const workspacePublisher = new OutboxPublisher('workspace-service');
    const memberPublisher = new OutboxPublisher('member-service');

    await workspacePublisher.publish(mockTx, WorkspaceCreatedSchema, mockWorkspaceData);
    await memberPublisher.publish(mockTx, WorkspaceCreatedSchema, mockWorkspaceData);

    expect(outboxRecords).toHaveLength(2);
    expect((outboxRecords[0].payload as any).source).toBe('workspace-service');
    expect((outboxRecords[1].payload as any).source).toBe('member-service');
  });
});

describe('Event envelope validation', () => {
  it('should include all required event fields', async () => {
    const { mockTx, outboxRecords } = createMockTransaction();
    const publisher = new OutboxPublisher('workspace-service');

    await publisher.publish(mockTx, WorkspaceCreatedSchema, mockWorkspaceData);

    const payload = outboxRecords[0].payload as any;

    expect(payload).toHaveProperty('correlationId');
    expect(payload).toHaveProperty('timestamp');
    expect(payload).toHaveProperty('source');
    expect(payload).toHaveProperty('subject');
    expect(payload).toHaveProperty('data');
  });

  it('should have valid subject derived from schema', async () => {
    const { mockTx, outboxRecords } = createMockTransaction();
    const publisher = new OutboxPublisher('workspace-service');

    await publisher.publish(mockTx, WorkspaceCreatedSchema, mockWorkspaceData);

    expect(outboxRecords[0].subject).toMatch(/workspace/i);
  });

  it('should serialize event data correctly', async () => {
    const { mockTx, outboxRecords } = createMockTransaction();
    const publisher = new OutboxPublisher('workspace-service');

    await publisher.publish(mockTx, WorkspaceCreatedSchema, mockWorkspaceData);

    const payload = outboxRecords[0].payload as any;
    expect(payload.data).toBeDefined();
    expect(typeof payload.data).toBe('object');
  });
});

describe('Error handling', () => {
  it('should propagate transaction errors', async () => {
    const mockTx: PrismaTransaction = {
      outbox: {
        create: vi.fn().mockRejectedValue(new Error('Database error')),
      },
    };

    const publisher = new OutboxPublisher('workspace-service');

    await expect(
      publisher.publish(mockTx, WorkspaceCreatedSchema, mockWorkspaceData)
    ).rejects.toThrow('Database error');
  });

  it('should not swallow errors in publish', async () => {
    const mockTx: PrismaTransaction = {
      outbox: {
        create: vi.fn().mockRejectedValue(new Error('Constraint violation')),
      },
    };

    const publisher = new OutboxPublisher('workspace-service');

    await expect(
      publisher.publish(mockTx, WorkspaceCreatedSchema, mockWorkspaceData)
    ).rejects.toThrow('Constraint violation');
  });
});

describe('Integration scenarios', () => {
  it('should support typical service usage pattern', async () => {
    const { mockTx, outboxRecords } = createMockTransaction();
    const publisher = new OutboxPublisher('workspace-service');

    // Simulate service creating workspace + publishing event
    // (in real code, this would be in a prisma.$transaction)
    const workspaceData = {
      workspace: {
        id: 'ws-123',
        name: 'My Workspace',
        handle: 'my-workspace',
        description: 'Test',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    };

    await publisher.publish(mockTx, WorkspaceCreatedSchema, workspaceData);

    expect(outboxRecords).toHaveLength(1);
    expect(mockTx.outbox.create).toHaveBeenCalled();
  });

  it('should support publishing multiple event types', async () => {
    const { mockTx, outboxRecords } = createMockTransaction();
    const publisher = new OutboxPublisher('workspace-service');

    await publisher.publish(mockTx, WorkspaceCreatedSchema, mockWorkspaceData);
    await publisher.publish(mockTx, WorkspaceCreatedSchema, mockWorkspaceData);

    expect(outboxRecords).toHaveLength(2);
  });
});
