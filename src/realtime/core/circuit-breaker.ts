import CircuitBreaker from 'opossum';
import { Logger } from 'pino';
import { circuitBreakerState } from './metrics';
import { defaultLogger } from '../utils/logger';

interface BreakerConfig {
  timeout?: number;
  errorThresholdPercentage?: number;
  resetTimeout?: number;
}

const DEFAULT_CONFIG: Required<BreakerConfig> = {
  timeout: 5000,
  errorThresholdPercentage: 50,
  resetTimeout: 30000,
};

const breakers = new Map<string, CircuitBreaker<any>>();

/**
 * Get or create circuit breaker for MQTT broker
 * @param brokerUrl - Unique identifier for broker (hostname or connection string)
 * @param logger - Logger instance (optional, uses default logger if not provided)
 * @param config - Optional circuit breaker config
 */
export function getOrCreateBreaker(
  brokerUrl: string,
  logger?: Logger,
  config: BreakerConfig = {}
): CircuitBreaker<any> {
  const effectiveLogger = logger || defaultLogger;
  
  if (breakers.has(brokerUrl)) {
    return breakers.get(brokerUrl)!;
  }

  const merged = { ...DEFAULT_CONFIG, ...config };
  const breaker = new CircuitBreaker(
    async (fn: () => Promise<void>) => fn(),
    {
      timeout: merged.timeout,
      errorThresholdPercentage: merged.errorThresholdPercentage,
      resetTimeout: merged.resetTimeout,
      name: `mqtt-breaker-${brokerUrl}`,
      rollingCountBuckets: 10,
      rollingCountTimeout: 10000,
    }
  );

  // State transition handlers
  breaker.on('open', () => {
    effectiveLogger.error({ broker: brokerUrl }, 'Circuit breaker OPEN - broker health check failed');
    circuitBreakerState.add(-1, { broker: brokerUrl });
  });

  breaker.on('halfOpen', () => {
    effectiveLogger.warn({ broker: brokerUrl }, 'Circuit breaker HALF-OPEN - attempting recovery');
  });

  breaker.on('close', () => {
    effectiveLogger.info({ broker: brokerUrl }, 'Circuit breaker CLOSED - broker recovered');
    circuitBreakerState.add(1, { broker: brokerUrl });
  });

  breaker.on('fallback', () => {
    effectiveLogger.error({ broker: brokerUrl }, 'Circuit breaker FALLBACK - returning cached/default response');
  });

  circuitBreakerState.add(1, { broker: brokerUrl }); // Start as closed (1)
  breakers.set(brokerUrl, breaker);
  return breaker;
}

/**
 * Check if circuit breaker is open for a broker
 */
export function isBreakerOpen(brokerUrl: string): boolean {
  const breaker = breakers.get(brokerUrl);
  if (!breaker) return false;
  return breaker.opened;
}

/**
 * Manually reset circuit breaker (for operational use)
 */
export function resetBreaker(brokerUrl: string): void {
  const breaker = breakers.get(brokerUrl);
  if (breaker) {
    breaker.fallback(() => {
      // Reset internal state
    });
    breaker.close();
  }
}

/**
 * Get metrics for all breakers
 */
export function getBreakerMetrics() {
  const metrics: Record<string, any> = {};
  breakers.forEach((breaker, url) => {
    metrics[url] = {
      isOpen: breaker.opened,
      failureCount: (breaker as any).stats?.fires || 0,
      successCount: (breaker as any).stats?.successes || 0,
    };
  });
  return metrics;
}
