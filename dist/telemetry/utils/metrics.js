import { metrics } from '@opentelemetry/api';
/**
 * Metric helper functions for OTel.
 *
 * Key design rules:
 * 1. Instruments (Counter, Histogram, UpDownCounter) are **long-lived singletons**.
 *    They are cached by (meterName, name) so creating a counter on every NATS
 *    message does not allocate a new object or trigger SDK deduplication warnings.
 * 2. `recordGauge` is an **UpDownCounter** — it tracks *deltas*, not absolute
 *    values.  For gauges that must reflect a current state, use
 *    `createObservableGauge` with a callback instead.
 * 3. Histogram instruments accept an optional `unit` string, which Grafana uses
 *    to auto-configure axis labels and alert thresholds (`ms`, `bytes`, etc.).
 *
 * @example
 * ```typescript
 * // Counter: track number of events
 * recordCounter('http_requests_total', 1, { method: 'POST', status: 200 });
 *
 * // Histogram: track distribution of values
 * recordHistogram('http_request_duration', 45.3, { endpoint: '/api/users' }, { unit: 'ms' });
 *
 * // UpDownCounter: track current resource level (delta-based)
 * addUpDownCounter('active_connections', 1);  // on connect
 * addUpDownCounter('active_connections', -1); // on disconnect
 *
 * // Observable gauge: report current memory usage periodically
 * createObservableGauge('heap_used_bytes', () => process.memoryUsage().heapUsed);
 * ```
 */
// ── Meter + instrument caches ──────────────────────────────────────────────────────
const DEFAULT_METER_NAME = '@nauticalstream/telemetry';
const meterCache = new Map();
const counterCache = new Map();
const histogramCache = new Map();
const udcCache = new Map();
const observableGaugeCache = new Map();
function getMeter(name = DEFAULT_METER_NAME) {
    if (!meterCache.has(name))
        meterCache.set(name, metrics.getMeter(name));
    return meterCache.get(name);
}
function getOrCreateCounter(name, meterName) {
    const key = `${meterName}:${name}`;
    if (!counterCache.has(key)) {
        counterCache.set(key, getMeter(meterName).createCounter(name, { description: `Counter for ${name}` }));
    }
    return counterCache.get(key);
}
function getOrCreateHistogram(name, meterName, unit) {
    // Unit is part of the cache key: the same metric name with different units
    // would otherwise silently return the first-created instrument.
    const key = `${meterName}:${name}:${unit ?? ''}`;
    if (!histogramCache.has(key)) {
        histogramCache.set(key, getMeter(meterName).createHistogram(name, { description: `Histogram for ${name}`, unit }));
    }
    return histogramCache.get(key);
}
function getOrCreateUpDownCounter(name, meterName) {
    const key = `${meterName}:${name}`;
    if (!udcCache.has(key)) {
        udcCache.set(key, getMeter(meterName).createUpDownCounter(name, { description: `UpDownCounter for ${name}` }));
    }
    return udcCache.get(key);
}
function getOrCreateObservableGauge(name, meterName, callback) {
    const key = `${meterName}:${name}`;
    if (!observableGaugeCache.has(key)) {
        const gauge = getMeter(meterName).createObservableGauge(name, { description: `Observable gauge for ${name}` });
        gauge.addCallback((observable) => {
            try {
                observable.observe(callback());
            }
            catch (error) {
                console.debug(`Failed to observe gauge ${name}:`, error);
            }
        });
        observableGaugeCache.set(key, gauge);
    }
    return observableGaugeCache.get(key);
}
// ── Public API ──────────────────────────────────────────────────────────────────
/**
 * Increment a counter metric.
 * Use for monotonically increasing event counts (requests, errors, messages…).
 *
 * @example
 * recordCounter('api_calls', 1, { endpoint: '/users', status: 200 });
 */
export function recordCounter(name, value = 1, attributes, meterName = DEFAULT_METER_NAME) {
    try {
        getOrCreateCounter(name, meterName).add(value, attributes);
    }
    catch (error) {
        console.debug(`Failed to record counter ${name}:`, error);
    }
}
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
export function recordHistogram(name, value, attributes, options) {
    try {
        const meterName = options?.meterName ?? DEFAULT_METER_NAME;
        getOrCreateHistogram(name, meterName, options?.unit).record(value, attributes);
    }
    catch (error) {
        console.debug(`Failed to record histogram ${name}:`, error);
    }
}
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
export function addUpDownCounter(name, value, attributes, meterName = DEFAULT_METER_NAME) {
    try {
        getOrCreateUpDownCounter(name, meterName).add(value, attributes);
    }
    catch (error) {
        console.debug(`Failed to record updown counter ${name}:`, error);
    }
}
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
export function recordGauge(name, value, attributes, meterName = DEFAULT_METER_NAME) {
    addUpDownCounter(name, value, attributes, meterName);
}
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
export function createObservableGauge(name, callback, meterName = DEFAULT_METER_NAME) {
    try {
        return getOrCreateObservableGauge(name, meterName, callback);
    }
    catch (error) {
        console.debug(`Failed to create observable gauge ${name}:`, error);
        // Fallback: create without callback so nothing is registered in the
        // collector — avoids polluting the metric namespace with a dead metric.
        return getMeter(meterName).createObservableGauge(name);
    }
}
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
export function startTimer(name, attributes, meterName = DEFAULT_METER_NAME) {
    const startTime = Date.now();
    return (resultAttrs) => {
        recordHistogram(name, Date.now() - startTime, { ...attributes, ...resultAttrs }, { unit: 'ms', meterName });
    };
}
//# sourceMappingURL=metrics.js.map