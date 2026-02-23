import { metrics } from '@opentelemetry/api';

const meter = metrics.getMeter('@nauticalstream/server', '1.0.0');

/**
 * Total HTTP requests received.
 *
 * Labels: method, route (pattern — not the dynamic URL), statusCode.
 * Using the route pattern (e.g. `/users/:id`) rather than the actual URL
 * prevents metric cardinality explosion from path parameters.
 */
export const httpRequestsTotal = meter.createCounter('http.requests.total', {
  description: 'Total HTTP requests received',
  unit: '{request}',
});

/**
 * HTTP request duration in milliseconds.
 * Labels: method, route, statusCode.
 */
export const httpRequestDuration = meter.createHistogram('http.request.duration.ms', {
  description: 'HTTP request duration in milliseconds',
  unit: 'ms',
});

/**
 * Number of currently in-flight HTTP requests.
 * Incremented on request arrival; decremented on response send.
 */
export const httpActiveRequests = meter.createUpDownCounter('http.active_requests', {
  description: 'Number of currently in-flight HTTP requests',
  unit: '{request}',
});

/**
 * HTTP error responses (4xx and 5xx).
 * Labels: method, route, statusCode.
 */
export const httpErrorsTotal = meter.createCounter('http.errors.total', {
  description: 'Total HTTP error responses (4xx and 5xx)',
  unit: '{error}',
});
