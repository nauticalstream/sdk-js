/**
 * Record a counter metric
 * Use for: counting events (requests, errors, messages, etc.)
 *
 * @param name - Metric name (e.g., 'http_requests_total')
 * @param value - Amount to add to counter (default: 1)
 * @param attributes - Optional metric attributes for dimensions
 * @param meterName - Optional meter name
 *
 * @example
 * recordCounter('api_calls', 1, { endpoint: '/users', status: 200 });
 */
export declare function recordCounter(name: string, value?: number, attributes?: Record<string, string | number | boolean>, meterName?: string): void;
/**
 * Record a histogram metric
 * Use for: measuring distributions (latency, packet size, etc.)
 *
 * @param name - Metric name (e.g., 'http_request_duration_ms')
 * @param value - Value to record
 * @param attributes - Optional metric attributes for dimensions
 * @param meterName - Optional meter name
 *
 * @example
 * recordHistogram('db_query_duration_ms', 45.3, { table: 'users' });
 */
export declare function recordHistogram(name: string, value: number, attributes?: Record<string, string | number | boolean>, meterName?: string): void;
/**
 * Record a gauge metric (observable gauge - current value)
 * Use for: tracking current state (memory usage, active connections, etc.)
 *
 * NOTE: For real-time gauges, use createObservableGauge() instead
 * This is for manual gauge updates
 *
 * @param name - Metric name (e.g., 'active_connections')
 * @param value - Current value
 * @param attributes - Optional metric attributes for dimensions
 * @param meterName - Optional meter name
 *
 * @example
 * recordGauge('queue_length', 42, { queue: 'background_jobs' });
 */
export declare function recordGauge(name: string, value: number, attributes?: Record<string, string | number | boolean>, meterName?: string): void;
/**
 * Create an observable gauge for continuous monitoring
 * Use for: values that change over time without explicit recording
 *
 * The callback is called periodically by the SDK
 *
 * @param name - Metric name (e.g., 'memory_usage_bytes')
 * @param callback - Function that returns the current value
 * @param meterName - Optional meter name
 *
 * @example
 * createObservableGauge('memory_usage_bytes', () => {
 *   const usage = process.memoryUsage();
 *   return usage.heapUsed;
 * });
 */
export declare function createObservableGauge(name: string, callback: () => number, meterName?: string): void;
/**
 * Helper for measuring operation duration
 * Returns a function to call when operation completes
 *
 * @param name - Metric name for duration histogram
 * @param attributes - Optional attributes
 * @param meterName - Optional meter name
 * @returns Function to call with operation result ({success: boolean})
 *
 * @example
 * const timer = startTimer('api_request_duration_ms');
 * try {
 *   await callApi();
 *   timer({ success: true });
 * } catch (err) {
 *   timer({ success: false, error_type: err.name });
 * }
 */
export declare function startTimer(name: string, attributes?: Record<string, string | number | boolean>, meterName?: string): (resultAttrs?: Record<string, string | number | boolean>) => void;
//# sourceMappingURL=metrics.d.ts.map