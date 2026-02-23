import { metrics } from '@opentelemetry/api';

const METER_NAME = '@nauticalstream/permissions';

const meter = metrics.getMeter(METER_NAME, '1.0.0');

/**
 * Permission check latency in milliseconds
 */
export const permissionsCheckLatency = meter.createHistogram('permissions.check.latency.ms', {
  description: 'Permission check operation latency in milliseconds',
  unit: 'ms',
});

/**
 * Permission write latency in milliseconds (grants/revokes)
 */
export const permissionsWriteLatency = meter.createHistogram('permissions.write.latency.ms', {
  description: 'Permission write operation latency in milliseconds',
  unit: 'ms',
});

/**
 * Successful permission checks
 */
export const permissionsCheckSuccess = meter.createCounter('permissions.check.success.total', {
  description: 'Total successful permission checks',
  unit: '{check}',
});

/**
 * Permission checks denied
 */
export const permissionsCheckDenied = meter.createCounter('permissions.check.denied.total', {
  description: 'Total permission checks denied by permission type',
  unit: '{check}',
});

/**
 * Permission check errors by type
 */
export const permissionsCheckErrors = meter.createCounter('permissions.check.errors.total', {
  description: 'Total permission check errors by type',
  unit: '{error}',
});

/**
 * Successful permission writes
 */
export const permissionsWriteSuccess = meter.createCounter('permissions.write.success.total', {
  description: 'Total successful permission writes',
  unit: '{write}',
});

/**
 * Permission write errors by type
 */
export const permissionsWriteErrors = meter.createCounter('permissions.write.errors.total', {
  description: 'Total permission write errors by type',
  unit: '{error}',
});

/**
 * Retry attempts
 */
export const permissionsRetryAttempts = meter.createCounter('permissions.retry.attempts.total', {
  description: 'Total permission operation retry attempts',
  unit: '{attempt}',
});

/**
 * Circuit breaker state for Keto endpoints
 */
export const permissionsCircuitBreakerState = meter.createUpDownCounter('permissions.circuit_breaker.state', {
  description: 'Permission circuit breaker state (1=closed, 0=open)',
  unit: '1',
});
