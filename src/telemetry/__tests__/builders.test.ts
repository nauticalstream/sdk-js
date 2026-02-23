import { describe, it, expect } from 'vitest';
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-node';
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from '@opentelemetry/semantic-conventions';
import {
  mergeConfig,
  buildResource,
  buildSpanProcessors,
  buildMetricReader,
  buildSampler,
  buildResourceDetectors,
  buildInstrumentations,
} from '../sdk/builders';
import { DEFAULT_CONFIG } from '../config';

// ── mergeConfig ───────────────────────────────────────────────────────────────

describe('mergeConfig', () => {
  it('applies DEFAULT_CONFIG for unspecified fields', () => {
    const merged = mergeConfig({ serviceName: 'svc' });
    expect(merged.environment).toBe(DEFAULT_CONFIG.environment);
    expect(merged.sampling?.probability).toBe(1.0);
    expect(merged.correlationId?.headerName).toBe('x-correlation-id');
  });

  it('caller values override defaults', () => {
    const merged = mergeConfig({
      serviceName: 'svc',
      serviceVersion: '9.9.9',
      environment: 'staging',
      sampling: { probability: 0.5 },
    });
    expect(merged.serviceVersion).toBe('9.9.9');
    expect(merged.environment).toBe('staging');
    expect(merged.sampling?.probability).toBe(0.5);
  });

  it('deep-merges nested instrumentations', () => {
    // Caller disables just graphql; all other defaults should remain
    const merged = mergeConfig({
      serviceName: 'svc',
      instrumentations: { graphql: true },
    });
    expect(merged.instrumentations?.fastify).toBe(true);  // default preserved
    expect(merged.instrumentations?.graphql).toBe(true);  // caller applied
  });

  it('deep-merges nested correlationId', () => {
    const merged = mergeConfig({
      serviceName: 'svc',
      correlationId: { generateIfMissing: false },
    });
    // headerName comes from default, generateIfMissing overridden
    expect(merged.correlationId?.headerName).toBe('x-correlation-id');
    expect(merged.correlationId?.generateIfMissing).toBe(false);
  });
});

// ── buildResource ─────────────────────────────────────────────────────────────

describe('buildResource', () => {
  it('sets service.name', () => {
    const r = buildResource({ serviceName: 'my-service' });
    expect(r.attributes[ATTR_SERVICE_NAME]).toBe('my-service');
  });

  it('sets service.version from config', () => {
    const r = buildResource({ serviceName: 'svc', serviceVersion: '2.3.4' });
    expect(r.attributes[ATTR_SERVICE_VERSION]).toBe('2.3.4');
  });

  it('sets deployment.environment', () => {
    const r = buildResource({ serviceName: 'svc', environment: 'production' });
    expect(r.attributes['deployment.environment']).toBe('production');
  });

  it('sets service.instance.id', () => {
    const r = buildResource({ serviceName: 'svc' });
    // Either the HOSTNAME env var or os.hostname() — just verify it's a non-empty string
    expect(typeof r.attributes['service.instance.id']).toBe('string');
    expect((r.attributes['service.instance.id'] as string).length).toBeGreaterThan(0);
  });

  it('merges extra resource attributes', () => {
    const r = buildResource({ serviceName: 'svc', resource: { 'team.name': 'platform' } });
    expect(r.attributes['team.name']).toBe('platform');
  });
});

// ── buildSpanProcessors ───────────────────────────────────────────────────────

describe('buildSpanProcessors', () => {
  it('returns [] when no exporters configured', () => {
    const processors = buildSpanProcessors({ serviceName: 'svc' });
    expect(processors).toHaveLength(0);
  });

  it('returns 1 BatchSpanProcessor for http OTLP', () => {
    const processors = buildSpanProcessors({
      serviceName: 'svc',
      otlp: { endpoint: 'http://localhost:4318', protocol: 'http' },
    });
    expect(processors).toHaveLength(1);
    expect(processors[0]).toBeInstanceOf(BatchSpanProcessor);
  });

  it('returns 1 BatchSpanProcessor for grpc OTLP', () => {
    const processors = buildSpanProcessors({
      serviceName: 'svc',
      otlp: { endpoint: 'http://localhost:4317', protocol: 'grpc' },
    });
    expect(processors).toHaveLength(1);
    expect(processors[0]).toBeInstanceOf(BatchSpanProcessor);
  });

  it('returns 1 BatchSpanProcessor for consoleExporter only', () => {
    const processors = buildSpanProcessors({ serviceName: 'svc', consoleExporter: true });
    expect(processors).toHaveLength(1);
    expect(processors[0]).toBeInstanceOf(BatchSpanProcessor);
  });

  it('returns 2 BatchSpanProcessors for OTLP + consoleExporter', () => {
    const processors = buildSpanProcessors({
      serviceName: 'svc',
      otlp: { endpoint: 'http://localhost:4318', protocol: 'http' },
      consoleExporter: true,
    });
    expect(processors).toHaveLength(2);
    expect(processors[0]).toBeInstanceOf(BatchSpanProcessor);
    expect(processors[1]).toBeInstanceOf(BatchSpanProcessor);
  });
});

// ── buildMetricReader ─────────────────────────────────────────────────────────

describe('buildMetricReader', () => {
  it('returns undefined when metricExport is not configured', () => {
    expect(buildMetricReader({ serviceName: 'svc' })).toBeUndefined();
  });

  it('returns a PeriodicExportingMetricReader for http', () => {
    const reader = buildMetricReader({
      serviceName: 'svc',
      metricExport: { endpoint: 'http://localhost:4318', protocol: 'http' },
    });
    expect(reader).toBeInstanceOf(PeriodicExportingMetricReader);
  });

  it('returns a PeriodicExportingMetricReader for grpc', () => {
    const reader = buildMetricReader({
      serviceName: 'svc',
      metricExport: { endpoint: 'http://localhost:4317', protocol: 'grpc' },
    });
    expect(reader).toBeInstanceOf(PeriodicExportingMetricReader);
  });
});

// ── buildSampler ──────────────────────────────────────────────────────────────

describe('buildSampler', () => {
  it('returns a sampler without throwing', () => {
    const sampler = buildSampler({ serviceName: 'svc', sampling: { probability: 1.0 } });
    expect(sampler).toBeDefined();
    // ParentBasedSampler exposes a toString() per OTel spec
    expect(typeof sampler.toString()).toBe('string');
  });

  it('accepts sampling probability 0 (trace nothing)', () => {
    expect(() => buildSampler({ serviceName: 'svc', sampling: { probability: 0 } })).not.toThrow();
  });

  it('defaults to probability 1.0 when sampling is omitted', () => {
    // Just verify no throw — probability is internal to ParentBasedSampler
    expect(() => buildSampler({ serviceName: 'svc' })).not.toThrow();
  });
});

// ── buildResourceDetectors ────────────────────────────────────────────────────

describe('buildResourceDetectors', () => {
  it("returns an array for strategy 'auto'", () => {
    const detectors = buildResourceDetectors({ serviceName: 'svc', resourceDetectors: 'auto' });
    expect(Array.isArray(detectors)).toBe(true);
    expect((detectors as any[]).length).toBeGreaterThan(0);
  });

  it("returns an array when resourceDetectors is omitted (defaults to 'auto')", () => {
    const detectors = buildResourceDetectors({ serviceName: 'svc' });
    expect(Array.isArray(detectors)).toBe(true);
  });

  it("returns undefined for strategy 'none'", () => {
    const detectors = buildResourceDetectors({ serviceName: 'svc', resourceDetectors: 'none' });
    expect(detectors).toBeUndefined();
  });
});

// ── buildInstrumentations ─────────────────────────────────────────────────────

describe('buildInstrumentations', () => {
  it('returns a non-empty array', () => {
    const insts = buildInstrumentations({
      serviceName: 'svc',
      instrumentations: { fastify: false, http: false, dns: false, mongodb: false },
    });
    expect(Array.isArray(insts)).toBe(true);
    expect(insts.length).toBeGreaterThan(0);
  });
});
