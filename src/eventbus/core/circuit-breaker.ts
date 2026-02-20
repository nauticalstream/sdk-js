import CircuitBreaker from 'opossum';
import { Logger } from 'pino';
import { jetstreamCircuitBreakerState } from './metrics';
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

export function getOrCreateBreaker(
  serverCluster: string,
  logger?: Logger,
  config: BreakerConfig = {}
): CircuitBreaker<any> {
  if (breakers.has(serverCluster)) {
    return breakers.get(serverCluster)!;
  }

  const effectiveLogger = logger || defaultLogger;
  const merged = { ...DEFAULT_CONFIG, ...config };
  const breaker = new CircuitBreaker(
    async (fn: () => Promise<void>) => fn(),
    {
      timeout: merged.timeout,
      errorThresholdPercentage: merged.errorThresholdPercentage,
      resetTimeout: merged.resetTimeout,
      name: `nats-breaker-${serverCluster}`,
      rollingCountBuckets: 10,
      rollingCountTimeout: 10000,
    }
  );

  breaker.on('open', () => {
    effectiveLogger.error({ server: serverCluster }, 'Circuit breaker OPEN - NATS cluster unhealthy');
    jetstreamCircuitBreakerState.add(-1, { server: serverCluster });
  });

  breaker.on('halfOpen', () => {
    effectiveLogger.warn({ server: serverCluster }, 'Circuit breaker HALF-OPEN - testing NATS recovery');
  });

  breaker.on('close', () => {
    effectiveLogger.info({ server: serverCluster }, 'Circuit breaker CLOSED - NATS recovered');
    jetstreamCircuitBreakerState.add(1, { server: serverCluster });
  });

  jetstreamCircuitBreakerState.add(1, { server: serverCluster });
  breakers.set(serverCluster, breaker);
  return breaker;
}

export function isBreakerOpen(serverCluster: string): boolean {
  const breaker = breakers.get(serverCluster);
  if (!breaker) return false;
  return breaker.opened;
}

export function resetBreaker(serverCluster: string): void {
  const breaker = breakers.get(serverCluster);
  if (breaker) {
    breaker.close();
  }
}
