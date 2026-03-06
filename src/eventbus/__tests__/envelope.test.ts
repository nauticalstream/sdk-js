import { describe, it, expect } from 'vitest';
import { buildEnvelope, parseEnvelope } from '../envelope';
import { WorkspaceCreatedSchema } from '@nauticalstream/proto/workspace/v1/workspace_events_pb';

// Minimal stand-in if the real proto isn't available — swap for any real schema
const SOURCE = 'test-service';
const SUBJECT = 'workspace.v1.workspace-created';
const CORRELATION = 'test-correlation-id';

describe('buildEnvelope', () => {
  it('sets id field as UUID v7', () => {
    const { event } = buildEnvelope(SOURCE, WorkspaceCreatedSchema, {}, { subject: SUBJECT, correlationId: CORRELATION });
    expect(typeof event.id).toBe('string');
    expect(event.id.length).toBe(36); // UUID format
    expect(event.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
  });

  it('generates unique ids for each call', () => {
    const { event: event1 } = buildEnvelope(SOURCE, WorkspaceCreatedSchema, {}, { subject: SUBJECT, correlationId: CORRELATION });
    const { event: event2 } = buildEnvelope(SOURCE, WorkspaceCreatedSchema, {}, { subject: SUBJECT, correlationId: CORRELATION });
    expect(event1.id).not.toBe(event2.id);
  });

  it('sets subject field', () => {
    const { event } = buildEnvelope(SOURCE, WorkspaceCreatedSchema, {}, { subject: SUBJECT, correlationId: CORRELATION });
    expect(event.subject).toBe(SUBJECT);
  });

  it('sets source', () => {
    const { event } = buildEnvelope(SOURCE, WorkspaceCreatedSchema, {}, { subject: SUBJECT, correlationId: CORRELATION });
    expect(event.source).toBe(SOURCE);
  });

  it('sets correlationId', () => {
    const { event } = buildEnvelope(SOURCE, WorkspaceCreatedSchema, {}, { subject: SUBJECT, correlationId: CORRELATION });
    expect(event.correlationId).toBe(CORRELATION);
  });

  it('auto-generates correlationId when not supplied', () => {
    const { event } = buildEnvelope(SOURCE, WorkspaceCreatedSchema, {}, { subject: SUBJECT });
    expect(typeof event.correlationId).toBe('string');
    expect(event.correlationId.length).toBeGreaterThan(0);
  });

  it('sets timestamp as ISO-8601 string', () => {
    const before = Date.now();
    const { event } = buildEnvelope(SOURCE, WorkspaceCreatedSchema, {}, { subject: SUBJECT, correlationId: CORRELATION });
    const after = Date.now();
    const ts = new Date(event.timestamp).getTime();
    expect(ts).toBeGreaterThanOrEqual(before);
    expect(ts).toBeLessThanOrEqual(after);
  });

  it('data is a plain object (JsonObject)', () => {
    const { event } = buildEnvelope(SOURCE, WorkspaceCreatedSchema, {}, { subject: SUBJECT, correlationId: CORRELATION });
    expect(event.data).toBeDefined();
    expect(typeof event.data).toBe('object');
    expect(Array.isArray(event.data)).toBe(false);
  });

  it('payload is a non-empty JSON string', () => {
    const { payload } = buildEnvelope(SOURCE, WorkspaceCreatedSchema, {}, { subject: SUBJECT, correlationId: CORRELATION });
    expect(typeof payload).toBe('string');
    expect(payload.length).toBeGreaterThan(0);
    expect(() => JSON.parse(payload)).not.toThrow();
  });
});

describe('parseEnvelope round-trip', () => {
  it('parseEnvelope(buildEnvelope().payload) equals the original event', () => {
    const { event, payload } = buildEnvelope(SOURCE, WorkspaceCreatedSchema, {}, { subject: SUBJECT, correlationId: CORRELATION });
    const parsed = parseEnvelope(payload);
    expect(parsed.id).toBe(event.id);
    expect(parsed.subject).toBe(event.subject);
    expect(parsed.source).toBe(event.source);
    expect(parsed.correlationId).toBe(event.correlationId);
    expect(parsed.timestamp).toBe(event.timestamp);
  });

  it('throws on malformed bytes', () => {
    expect(() => parseEnvelope(new Uint8Array([0xff, 0xfe]))).toThrow();
  });
});
