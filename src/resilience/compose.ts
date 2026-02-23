/**
 * Compose - Combines timeout + retry + circuit breaker + metrics
 * Layering: timeout → retry → circuit breaker → metrics
 */

import type { Logger } from 'pino';
import type { Counter, Histogram } from '@opentelemetry/api';
import { retryOperation, type RetryConfig, DEFAULT_RETRY_CONFIG } from './retry';
import { ResilientCircuitBreaker } from './circuit-breaker';
import { executeWithTimeout } from './timeout';

export type ErrorClassifier<E extends Error = Error> = (error: unknown) => E;

export interface ResilienceMetrics {
  latency?: Histogram;
  success?: Counter;
  errors?: Counter;
  retries?: Counter;
}

export interface ResilienceConfig<E extends Error = Error> {
  operation: string;
  logger?: Logger;
  classifier: ErrorClassifier<E>;
  shouldRetry: (error: E) => boolean;
  retry?: RetryConfig;
  breaker?: ResilientCircuitBreaker<any>;
  timeoutMs?: number;
  metrics?: ResilienceMetrics;
  labels?: Record<string, string | number>;
  /** Log level used when an error is caught. Defaults to 'error'. Use 'debug' for health probes. */
  errorLogLevel?: 'fatal' | 'error' | 'warn' | 'info' | 'debug' | 'trace';
}

// Execute with all resilience layers applied
export async function resilientOperation<T, E extends Error = Error>(
  fn: () => Promise<T>,
  config: ResilienceConfig<E>
): Promise<T> {
  const start = Date.now();
  const { operation, logger, classifier, shouldRetry, retry, breaker, timeoutMs, metrics, labels, errorLogLevel = 'error' } = config;
  
  // Build wrapped function: timeout (innermost) → retry
  const buildResilientFn = (): (() => Promise<T>) => {
    let wrapped = fn;
    
    if (timeoutMs) {
      const base = wrapped;
      wrapped = () => executeWithTimeout(
        base,
        timeoutMs,
        () => logger?.warn({ operation, timeoutMs }, 'Operation timed out')
      );
    }
    
    if (retry) {
      const base = wrapped;
      wrapped = () => retryOperation(
        base,
        (error) => shouldRetry(classifier(error)),
        { ...DEFAULT_RETRY_CONFIG, ...retry },
        (attempt, error) => {
          metrics?.retries?.add(1, { ...labels, attempt });
          logger?.warn({ operation, attempt, error: error.message }, 'Retrying');
        }
      );
    }
    
    return wrapped;
  };
  
  const resilientFn = buildResilientFn();
  
  // Circuit breaker is outermost — sees final outcome after all retries
  const execute = breaker
    ? () => breaker.execute(resilientFn)
    : resilientFn;
  
  // Execute and track metrics
  try {
    const result = await execute();
    const latency = Date.now() - start;
    
    metrics?.latency?.record(latency, labels);
    metrics?.success?.add(1, labels);
    logger?.debug({ operation, latencyMs: latency, ...labels }, 'Success');
    
    return result;
  } catch (error) {
    const classified = classifier(error);
    const latency = Date.now() - start;
    const errorType = classified.constructor.name;
    
    metrics?.latency?.record(latency, labels);
    metrics?.errors?.add(1, { ...labels, errorType });
    logger?.[errorLogLevel]({ operation, error: classified.message, errorType, latencyMs: latency, ...labels }, 'Failed');
    
    throw classified;
  }
}

// Wrap function with resilience config
export function createResilientFunction<T extends any[], R, E extends Error = Error>(
  fn: (...args: T) => Promise<R>,
  config: Omit<ResilienceConfig<E>, 'operation'> & { operation?: string }
): (...args: T) => Promise<R> {
  const operation = config.operation || fn.name || 'anonymous';
  return (...args: T) => resilientOperation(() => fn(...args), { operation, ...config } as ResilienceConfig<E>);
}

