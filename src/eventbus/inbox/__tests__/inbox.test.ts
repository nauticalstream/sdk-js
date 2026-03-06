/**
 * @nauticalstream/sdk — Inbox Pattern Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { create } from '@bufbuild/protobuf';
import { EventSchema } from '@nauticalstream/proto/platform/v1/event_pb';
import { withIdempotentHandler, EventProcessor, isEventProcessed, markEventProcessed } from '../index';
import type { Event } from '../../envelope';
import type { PrismaClient, PrismaTransaction } from '../types';

// ── Mock Data ────────────────────────────────────────────────────────────────

const mockEvent: Event = create(EventSchema, {
  subject: 'article.created',
  source: 'article-service',
  correlationId: 'test-correlation-123',
  timestamp: '2026-03-06T10:00:00Z',
  data: {},
});

// ── Mock Prisma Client ───────────────────────────────────────────────────────

function createMockPrisma() {
  const processedEvents = new Map<string, unknown>();

  const mockTx: PrismaTransaction = {
    processedEvent: {
      findUnique: vi.fn(async ({ where }) => {
        const key = `${where.correlationId_consumerName.correlationId}:${where.correlationId_consumerName.consumerName}`;
        return processedEvents.has(key) ? { id: key } : null;
      }),
      create: vi.fn(async ({ data }) => {
        const key = `${data.correlationId}:${data.consumerName}`;
        processedEvents.set(key, data);
        return { id: key, ...data };
      }),
    },
  };

  const mockPrisma: PrismaClient = {
    $transaction: vi.fn(async (fn) => {
      return fn(mockTx);
    }),
  };

  return { mockPrisma, mockTx, processedEvents };
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('isEventProcessed', () => {
  it('should return false when event not processed', async () => {
    const { mockTx } = createMockPrisma();

    const result = await isEventProcessed(mockTx, 'correlation-123', 'test-consumer');

    expect(result).toBe(false);
    expect(mockTx.processedEvent.findUnique).toHaveBeenCalledWith({
      where: {
        correlationId_consumerName: {
          correlationId: 'correlation-123',
          consumerName: 'test-consumer',
        },
      },
    });
  });

  it('should return true when event already processed', async () => {
    const { mockTx, processedEvents } = createMockPrisma();
    processedEvents.set('correlation-123:test-consumer', { id: 'test' });

    const result = await isEventProcessed(mockTx, 'correlation-123', 'test-consumer');

    expect(result).toBe(true);
  });
});

describe('markEventProcessed', () => {
  it('should create processed event record with correct data', async () => {
    const { mockTx } = createMockPrisma();

    await markEventProcessed(mockTx, mockEvent, 'article-consumer');

    expect(mockTx.processedEvent.create).toHaveBeenCalledWith({
      data: {
        correlationId: 'test-correlation-123',
        subject: 'article.created',
        streamName: 'core-nats',
        sequenceNumber: BigInt(0),
        source: 'article-service',
        consumerName: 'article-consumer',
        eventTimestamp: new Date('2026-03-06T10:00:00Z'),
        processedAt: expect.any(Date),
      },
    });
  });
});

describe('withIdempotentHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should execute handler when event not processed', async () => {
    const { mockPrisma, mockTx } = createMockPrisma();
    const handler = vi.fn(async () => 'result');

    const result = await withIdempotentHandler(
      mockPrisma,
      mockEvent,
      'article-consumer',
      handler
    );

    expect(result).toBe('result');
    expect(handler).toHaveBeenCalledWith(mockTx);
    expect(mockTx.processedEvent.findUnique).toHaveBeenCalled();
    expect(mockTx.processedEvent.create).toHaveBeenCalled();
  });

  it('should return null when event already processed', async () => {
    const { mockPrisma, processedEvents } = createMockPrisma();
    processedEvents.set('test-correlation-123:article-consumer', { id: 'test' });
    const handler = vi.fn(async () => 'result');

    const result = await withIdempotentHandler(
      mockPrisma,
      mockEvent,
      'article-consumer',
      handler
    );

    expect(result).toBe(null);
    expect(handler).not.toHaveBeenCalled();
  });

  it('should not mark as processed on handler error', async () => {
    const { mockPrisma, mockTx } = createMockPrisma();
    const handler = vi.fn(async () => {
      throw new Error('Handler failed');
    });

    await expect(
      withIdempotentHandler(mockPrisma, mockEvent, 'article-consumer', handler)
    ).rejects.toThrow('Handler failed');

    expect(handler).toHaveBeenCalledWith(mockTx);
    expect(mockTx.processedEvent.create).not.toHaveBeenCalled();
  });

  it('should skip marking processed when skipMarkProcessed option is true', async () => {
    const { mockPrisma, mockTx } = createMockPrisma();
    const handler = vi.fn(async () => 'result');

    const result = await withIdempotentHandler(
      mockPrisma,
      mockEvent,
      'article-consumer',
      handler,
      { skipMarkProcessed: true }
    );

    expect(result).toBe('result');
    expect(handler).toHaveBeenCalled();
    expect(mockTx.processedEvent.create).not.toHaveBeenCalled();
  });

  it('should call logger when provided', async () => {
    const { mockPrisma } = createMockPrisma();
    const handler = vi.fn(async () => 'result');
    const logger = {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    };

    await withIdempotentHandler(
      mockPrisma,
      mockEvent,
      'article-consumer',
      handler,
      { logger }
    );

    expect(logger.info).toHaveBeenCalledWith(
      'Processing event',
      expect.objectContaining({
        correlationId: 'test-correlation-123',
        consumerName: 'article-consumer',
        subject: 'article.created',
        source: 'article-service',
      })
    );

    expect(logger.info).toHaveBeenCalledWith(
      'Event marked as processed',
      expect.objectContaining({
        correlationId: 'test-correlation-123',
        consumerName: 'article-consumer',
      })
    );
  });

  it('should log when event already processed', async () => {
    const { mockPrisma, processedEvents } = createMockPrisma();
    processedEvents.set('test-correlation-123:article-consumer', { id: 'test' });
    const handler = vi.fn(async () => 'result');
    const logger = {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    };

    await withIdempotentHandler(
      mockPrisma,
      mockEvent,
      'article-consumer',
      handler,
      { logger }
    );

    expect(logger.info).toHaveBeenCalledWith(
      'Event already processed, skipping',
      expect.objectContaining({
        correlationId: 'test-correlation-123',
        consumerName: 'article-consumer',
      })
    );
  });

  it('should handle different consumer names independently', async () => {
    const { mockPrisma, mockTx } = createMockPrisma();
    const handler1 = vi.fn(async () => 'result1');
    const handler2 = vi.fn(async () => 'result2');

    // First consumer processes
    const result1 = await withIdempotentHandler(
      mockPrisma,
      mockEvent,
      'consumer-1',
      handler1
    );

    // Second consumer processes same event
    const result2 = await withIdempotentHandler(
      mockPrisma,
      mockEvent,
      'consumer-2',
      handler2
    );

    expect(result1).toBe('result1');
    expect(result2).toBe('result2');
    expect(handler1).toHaveBeenCalled();
    expect(handler2).toHaveBeenCalled();
    expect(mockTx.processedEvent.create).toHaveBeenCalledTimes(2);
  });
});

describe('EventProcessor', () => {
  it('should process event using configured consumer name', async () => {
    const { mockPrisma, mockTx } = createMockPrisma();
    const processor = new EventProcessor(mockPrisma, 'article-consumer');
    const handler = vi.fn(async () => 'result');

    const result = await processor.process(mockEvent, handler);

    expect(result).toBe('result');
    expect(handler).toHaveBeenCalledWith(mockTx);
    expect(mockTx.processedEvent.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        consumerName: 'article-consumer',
      }),
    });
  });

  it('should return consumer name', () => {
    const { mockPrisma } = createMockPrisma();
    const processor = new EventProcessor(mockPrisma, 'test-consumer');

    expect(processor.getConsumerName()).toBe('test-consumer');
  });

  it('should merge default options with call-specific options', async () => {
    const { mockPrisma } = createMockPrisma();
    const defaultLogger = {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    };
    const callLogger = {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    };

    const processor = new EventProcessor(mockPrisma, 'article-consumer', {
      logger: defaultLogger,
    });

    const handler = vi.fn(async () => 'result');

    // Call-specific logger overrides default
    await processor.process(mockEvent, handler, { logger: callLogger });

    expect(callLogger.info).toHaveBeenCalled();
    expect(defaultLogger.info).not.toHaveBeenCalled();
  });

  it('should use default options when no call-specific options provided', async () => {
    const { mockPrisma } = createMockPrisma();
    const logger = {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    };

    const processor = new EventProcessor(mockPrisma, 'article-consumer', {
      logger,
    });

    const handler = vi.fn(async () => 'result');

    await processor.process(mockEvent, handler);

    expect(logger.info).toHaveBeenCalled();
  });

  it('should return null for already processed events', async () => {
    const { mockPrisma, processedEvents } = createMockPrisma();
    processedEvents.set('test-correlation-123:article-consumer', { id: 'test' });

    const processor = new EventProcessor(mockPrisma, 'article-consumer');
    const handler = vi.fn(async () => 'result');

    const result = await processor.process(mockEvent, handler);

    expect(result).toBe(null);
    expect(handler).not.toHaveBeenCalled();
  });
});

describe('Idempotency guarantees', () => {
  it('should prevent duplicate processing of same event', async () => {
    const { mockPrisma } = createMockPrisma();
    const handler = vi.fn(async () => 'result');

    // First call - should process
    const result1 = await withIdempotentHandler(
      mockPrisma,
      mockEvent,
      'article-consumer',
      handler
    );

    // Second call - should skip
    const result2 = await withIdempotentHandler(
      mockPrisma,
      mockEvent,
      'article-consumer',
      handler
    );

    expect(result1).toBe('result');
    expect(result2).toBe(null);
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('should maintain transaction atomicity', async () => {
    const { mockPrisma, mockTx } = createMockPrisma();
    const operations: string[] = [];

    const handler = vi.fn(async (tx: PrismaTransaction) => {
      operations.push('handler-start');
      // Simulate business logic
      operations.push('business-logic');
      operations.push('handler-end');
      return 'result';
    });

    await withIdempotentHandler(mockPrisma, mockEvent, 'article-consumer', handler);

    // Verify transaction was used
    expect(mockPrisma.$transaction).toHaveBeenCalled();
    expect(handler).toHaveBeenCalledWith(mockTx);
    expect(operations).toEqual(['handler-start', 'business-logic', 'handler-end']);
  });
});
