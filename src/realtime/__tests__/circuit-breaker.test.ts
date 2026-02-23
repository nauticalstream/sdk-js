import { describe, it, expect, afterEach } from 'vitest';
import { resetBreaker, getBreakerMetrics } from '../core/circuit-breaker';
import { getOrCreateCircuitBreaker, clearAllCircuitBreakers } from '../../resilience';

afterEach(() => {
  clearAllCircuitBreakers();
});

// ---------------------------------------------------------------------------
// Bug 3 fix: resetBreaker / getBreakerMetrics keyed by brokerUrl, not 'mqtt-publish'
// ---------------------------------------------------------------------------
describe('resetBreaker', () => {
  it('accepts a brokerUrl parameter (no overload with default "mqtt-publish")', () => {
    // Pre-create a breaker for a specific URL
    getOrCreateCircuitBreaker('mqtt://broker.test:1883');

    // Should not throw — and should reset the correct breaker
    expect(() => resetBreaker('mqtt://broker.test:1883')).not.toThrow();
  });
});

describe('getBreakerMetrics', () => {
  it('returns undefined when no breaker exists for the given URL', () => {
    expect(getBreakerMetrics('mqtt://nonexistent:1883')).toBeUndefined();
  });

  it('returns metrics when a breaker exists for the given URL', () => {
    const brokerUrl = 'mqtt://broker.test:1883';
    getOrCreateCircuitBreaker(brokerUrl);

    const metrics = getBreakerMetrics(brokerUrl);
    expect(metrics).toBeDefined();
    // Verify the metrics object has expected shape
    expect(typeof metrics!.state).toBe('string');
  });

  it('does NOT return metrics for the legacy "mqtt-publish" key', () => {
    // Ensure the old default key is never implicitly created by our helpers
    const metrics = getBreakerMetrics('mqtt-publish');
    expect(metrics).toBeUndefined();
  });
});
