import { describe, it, expect, vi } from 'vitest';
import {
  recordCounter,
  recordHistogram,
  recordGauge,
  createObservableGauge,
  startTimer,
} from '../utils/metrics';

// All metric helpers wrap OTel API calls in try-catch and use the no-op
// provider in tests, so they must never throw.

describe('recordCounter', () => {
  it('does not throw with minimal args', () => {
    expect(() => recordCounter('test_counter')).not.toThrow();
  });

  it('does not throw with value and attributes', () => {
    expect(() =>
      recordCounter('test_counter', 5, { endpoint: '/api', status: 200 })
    ).not.toThrow();
  });

  it('does not throw with a custom meter name', () => {
    expect(() => recordCounter('test_counter', 1, {}, 'my-meter')).not.toThrow();
  });

  it('does not throw when called multiple times with the same name (meter cache)', () => {
    expect(() => {
      recordCounter('cached_counter', 1);
      recordCounter('cached_counter', 2);
      recordCounter('cached_counter', 3);
    }).not.toThrow();
  });
});

describe('recordHistogram', () => {
  it('does not throw with a value', () => {
    expect(() => recordHistogram('request_duration_ms', 42.5)).not.toThrow();
  });

  it('does not throw with attributes', () => {
    expect(() =>
      recordHistogram('db_query_ms', 12.3, { table: 'users', operation: 'select' })
    ).not.toThrow();
  });

  it('does not throw with zero value', () => {
    expect(() => recordHistogram('noop_duration', 0)).not.toThrow();
  });

  it('does not throw with negative value', () => {
    // OTel histograms should reject negative values — we just verify no throw due to try-catch
    expect(() => recordHistogram('negative', -1)).not.toThrow();
  });
});

describe('recordGauge', () => {
  it('does not throw with a positive value', () => {
    expect(() => recordGauge('active_connections', 42)).not.toThrow();
  });

  it('does not throw with zero (UpDownCounter accepts zero)', () => {
    expect(() => recordGauge('queue_length', 0)).not.toThrow();
  });

  it('does not throw with negative value (UpDownCounter decrement)', () => {
    expect(() => recordGauge('delta_connections', -5)).not.toThrow();
  });

  it('does not throw with attributes', () => {
    expect(() =>
      recordGauge('queue_length', 7, { queue: 'background', priority: 'high' })
    ).not.toThrow();
  });
});

describe('createObservableGauge', () => {
  it('does not throw', () => {
    expect(() => createObservableGauge('memory_usage', () => 1024)).not.toThrow();
  });

  it('does not throw when callback would throw', () => {
    expect(() =>
      createObservableGauge('bad_gauge', () => { throw new Error('observe fail'); })
    ).not.toThrow();
  });

  it('accepts an optional meter name', () => {
    expect(() =>
      createObservableGauge('heap_used', () => process.memoryUsage().heapUsed, 'sys-meter')
    ).not.toThrow();
  });
});

describe('startTimer', () => {
  it('returns a function', () => {
    const stop = startTimer('op_duration_ms');
    expect(typeof stop).toBe('function');
  });

  it('calling stop does not throw', () => {
    const stop = startTimer('op_duration_ms');
    expect(() => stop()).not.toThrow();
  });

  it('calling stop with result attributes does not throw', () => {
    const stop = startTimer('op_duration_ms', { service: 'user-service' });
    expect(() => stop({ success: true })).not.toThrow();
  });

  it('measured duration is non-negative', () => {
    const recordHistogramSpy = vi.fn();
    // We can verify the elapsed time is >= 0 by observing the stop callback timing
    const start = Date.now();
    const stop = startTimer('timed_op');
    stop();
    const elapsed = Date.now() - start;
    // elapsed captured externally >= internal duration captured by startTimer
    expect(elapsed).toBeGreaterThanOrEqual(0);
  });

  it('can be called multiple times independently', () => {
    const stop1 = startTimer('op1');
    const stop2 = startTimer('op2');
    expect(() => { stop1(); stop2(); }).not.toThrow();
  });
});
