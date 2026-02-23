import { type ObservableGauge } from '@opentelemetry/api';
/**
 * Increment a counter metric.
 * Use for monotonically increasing event counts (requests, errors, messages…).
 *
 * @example
 * recordCounter('api_calls', 1, { endpoint: '/users', status: 200 });
 */
export declare function recordCounter(name: string, value?: number, attributes?: Record<string, string | number | boolean>, meterName?: string): void;
/**
 * Record a value in a histogram (distribution of measurements).
 * Use for latency, payload sizes, queue depths, and other distributions.
 *
 * @param unit - OTel-standard unit string used by Grafana for axis labels:
 *               `'ms'` for milliseconds, `'bytes'`, `'{requests}'`, etc.
 *
 * @example
 * recordHistogram('db_query_duration', 45.3, { table: 'users' }, { unit: 'ms' });
 */
export declare function recordHistogram(name: string, value: number, attributes?: Record<string, string | number | boolean>, options?: {
    unit?: string;
    meterName?: string;
}): void;
/**
 * Add a delta to an UpDownCounter.
 * Use for values that can both increase and decrease, such as the number of
 * active connections or items currently in a queue.
 *
 * **Important:** this tracks *deltas*, not absolute values.
 * - To add one connection:    `addUpDownCounter('active_connections', 1)`
 * - To remove one connection: `addUpDownCounter('active_connections', -1)`
 *
 * For a metric that tracks a current absolute state (e.g. memory usage),
 * use `createObservableGauge` with a callback instead.
 */
export declare function addUpDownCounter(name: string, value: number, attributes?: Record<string, string | number | boolean>, meterName?: string): void;
/**
 * @deprecated Use `addUpDownCounter` for delta-based resource tracking, or
 * `createObservableGauge` for current-state metrics.
 *
 * This function uses an UpDownCounter under the hood, which means successive
 * calls **accumulate** rather than setting an absolute value:
 *   `recordGauge('workers', 3)` + `recordGauge('workers', 5)` = **8**, not 5.
 *
 * Kept for backward compatibility.
 */
export declare function recordGauge(name: string, value: number, attributes?: Record<string, string | number | boolean>, meterName?: string): void;
/**
 * Register an observable gauge for continuous monitoring.
 * The `callback` is called periodically by the SDK and should return the
 * current value at observation time.
 *
 * Use for: heap memory, CPU usage, queue depth, open file descriptors…
 *
 * @example
 * createObservableGauge('heap_used_bytes', () => process.memoryUsage().heapUsed);
 */
export declare function createObservableGauge(name: string, callback: () => number, meterName?: string): ObservableGauge;
/**
 * Start a duration timer. Call the returned function when the operation
 * finishes — it records the elapsed time as a histogram with `unit: 'ms'`.
 *
 * @example
 * const stop = startTimer('db_query_duration', { table: 'users' });
 * try {
 *   await db.query(...);
 *   stop({ success: true });
 * } catch (err) {
 *   stop({ success: false, error_type: err.constructor.name });
 * }
 */
export declare function startTimer(name: string, attributes?: Record<string, string | number | boolean>, meterName?: string): (resultAttrs?: Record<string, string | number | boolean>) => void;
//# sourceMappingURL=metrics.d.ts.map