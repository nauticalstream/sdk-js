import { describe, it, expect } from 'vitest';
import { buildEnvelope, parseEnvelope } from '../envelope';
import { WorkspaceCreatedSchema } from '@nauticalstream/proto/workspace/v1/workspace_events_pb';

// Minimal stand-in if the real proto isn't available — swap for any real schema
const SOURCE = 'test-service';
const SUBJECT = 'workspace.v1.workspace-created';
const CORRELATION = 'test-correlation-id';

describe('buildEnvelope', () => {
  it('sets type equal to subject', () => {
    const { event } = buildEnvelope(SOURCE, WorkspaceCreatedSchema, {}, { subject: SUBJECT, correlationId: CORRELATION });
    expect(event.type).toBe(SUBJECT);
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
    expect(parsed.type).toBe(event.type);
    expect(parsed.source).toBe(event.source);
    expect(parsed.correlationId).toBe(event.correlationId);
    expect(parsed.timestamp).toBe(event.timestamp);
  });

  it('throws on malformed bytes', () => {
    expect(() => parseEnvelope(new Uint8Array([0xff, 0xfe]))).toThrow();
  });
});
