/**
 * Circuit Breaker - Prevents cascading failures using opossum
 * Opens after threshold failures, auto-recovers after timeout
 */

import CircuitBreaker from 'opossum';
import type { Options as OpossumOptions } from 'opossum';
import type { UpDownCounter } from '@opentelemetry/api';

export type BreakerState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export interface CircuitBreakerConfig {
  failureThreshold: number;  // 0.5 = 50% failure rate to open
  timeoutMs: number;         // how long to stay open before half-open
  volumeThreshold: number;   // min requests before calculating rate
  /**
   * Optional OTel UpDownCounter updated on every state transition.
   * Value semantics: 1 = CLOSED (healthy), 0.5 = HALF_OPEN (probing), 0 = OPEN (blocked).
   * Enables Grafana alerts: alert when metric < 1.
   */
  stateMetric?: UpDownCounter;
}

export const DEFAULT_CIRCUIT_BREAKER_CONFIG: CircuitBreakerConfig = {
  failureThreshold: 0.5,
  timeoutMs: 30000,
  volumeThreshold: 10,
};

export interface BreakerMetrics {
  state: BreakerState;
  failures: number;
  successes: number;
  totalRequests: number;
  failureRate: number;
}

// Map config to opossum format
function toOpossumOptions(config: CircuitBreakerConfig): OpossumOptions {
  return {
    timeout: false, // Handled separately
    errorThresholdPercentage: config.failureThreshold * 100,
    resetTimeout: config.timeoutMs,
    volumeThreshold: config.volumeThreshold,
    rollingCountTimeout: 10000,
    rollingCountBuckets: 10,
  };
}

// Wrapper around opossum with simpler API
export class ResilientCircuitBreaker<R = any> {
  private breaker: CircuitBreaker<[() => Promise<R>], R>;
  
  constructor(
    config: CircuitBreakerConfig = DEFAULT_CIRCUIT_BREAKER_CONFIG,
    public readonly name?: string
  ) {
    // Breaker wraps a pass-through so the real fn is passed at execute() time
    this.breaker = new CircuitBreaker((fn: () => Promise<R>) => fn(), toOpossumOptions(config));

    if (config.stateMetric) {
      const metric = config.stateMetric;
      const attrs = name ? { breaker: name } : {};
      // Track current level so every event computes the exact delta needed,
      // regardless of which state we came from. This correctly handles the
      // HALF_OPEN → OPEN path (probe fails) where naive fixed deltas diverge.
      // Value semantics: 1 = CLOSED, 0.5 = HALF_OPEN (probing), 0 = OPEN
      let currentLevel = 1; // opossum always starts CLOSED
      const setLevel = (next: number) => {
        metric.add(next - currentLevel, attrs);
        currentLevel = next;
      };
      metric.add(1, attrs); // initialise to CLOSED
      this.breaker.on('open',     () => setLevel(0));
      this.breaker.on('halfOpen', () => setLevel(0.5));
      this.breaker.on('close',    () => setLevel(1));
    }
  }
  
  async execute(fn: () => Promise<R>): Promise<R> {
    return this.breaker.fire(fn);
  }
  
  getState(): BreakerState {
    if (this.breaker.opened) return 'OPEN';
    if (this.breaker.halfOpen) return 'HALF_OPEN';
    return 'CLOSED';
  }
  
  getMetrics(): BreakerMetrics {
    const s = this.breaker.stats;
    const failures = s.failures || 0;
    const successes = s.successes || 0;
    const total = failures + successes;
    
    return {
      state: this.getState(),
      failures,
      successes,
      totalRequests: total,
      failureRate: total > 0 ? failures / total : 0,
    };
  }
  
  isOpen(): boolean {
    return this.breaker.opened;
  }
  
  reset(): void {
    this.breaker.close();
  }
  
  /** Access underlying opossum for advanced use */
  getBreaker(): CircuitBreaker<[() => Promise<R>], R> {
    return this.breaker;
  }
}

// Global registry for named breakers
const breakers = new Map<string, ResilientCircuitBreaker<any>>();

/**
 * Get or create a named circuit breaker from the global registry.
 *
 * Config is ONLY applied on first creation — subsequent calls with the
 * same name return the existing breaker regardless of the config argument.
 * This is intentional: a shared registry must have a single stable config
 * per breaker. Pass `stateMetric` in config to wire OTel state tracking.
 */
export function getOrCreateCircuitBreaker<R = any>(
  name: string,
  config?: CircuitBreakerConfig
): ResilientCircuitBreaker<R> {
  let breaker = breakers.get(name) as ResilientCircuitBreaker<R> | undefined;
  if (!breaker) {
    breaker = new ResilientCircuitBreaker<R>(config, name);
    breakers.set(name, breaker);
  }
  return breaker;
}

export function getCircuitBreaker<R = any>(name: string): ResilientCircuitBreaker<R> | undefined {
  return breakers.get(name) as ResilientCircuitBreaker<R> | undefined;
}

export function resetCircuitBreaker(name: string): void {
  breakers.get(name)?.reset();
}

export function clearAllCircuitBreakers(): void {
  breakers.clear();
}
