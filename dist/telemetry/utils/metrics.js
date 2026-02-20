"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.recordCounter = recordCounter;
exports.recordHistogram = recordHistogram;
exports.recordGauge = recordGauge;
exports.createObservableGauge = createObservableGauge;
exports.startTimer = startTimer;
const api_1 = require("@opentelemetry/api");
/**
 * Metric helper functions for OTel v2
 *
 * Usage:
 * ```typescript
 * // Counter: track number of events
 * recordCounter('http_requests_total', 1, { method: 'POST', status: 200 });
 *
 * // Histogram: track distribution of values
 * recordHistogram('http_request_duration_ms', 45.3, { endpoint: '/api/users' });
 *
 * // Gauge: track current value
 * recordGauge('active_connections', 42);
 * ```
 */
// Cache meters to avoid recreating them
const meterCache = new Map();
/**
 * Get or create a meter for the given name
 */
function getMeter(name = '@nauticalstream/telemetry') {
    if (!meterCache.has(name)) {
        meterCache.set(name, api_1.metrics.getMeter(name));
    }
    return meterCache.get(name);
}
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
function recordCounter(name, value = 1, attributes, meterName) {
    try {
        const meter = getMeter(meterName);
        const counter = meter.createCounter(name, {
            description: `Counter for ${name}`,
        });
        counter.add(value, attributes);
    }
    catch (error) {
        console.debug(`Failed to record counter ${name}:`, error);
    }
}
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
function recordHistogram(name, value, attributes, meterName) {
    try {
        const meter = getMeter(meterName);
        const histogram = meter.createHistogram(name, {
            description: `Histogram for ${name}`,
        });
        histogram.record(value, attributes);
    }
    catch (error) {
        console.debug(`Failed to record histogram ${name}:`, error);
    }
}
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
function recordGauge(name, value, attributes, meterName) {
    try {
        const meter = getMeter(meterName);
        // OTel v2 uses UpDownCounter for manual gauge updates
        const upDownCounter = meter.createUpDownCounter(name, {
            description: `Gauge for ${name}`,
        });
        upDownCounter.add(value, attributes);
    }
    catch (error) {
        console.debug(`Failed to record gauge ${name}:`, error);
    }
}
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
function createObservableGauge(name, callback, meterName) {
    try {
        const meter = getMeter(meterName);
        meter.createObservableGauge(name, {
            description: `Observable gauge for ${name}`,
        }).addCallback((observable) => {
            try {
                const value = callback();
                observable.observe(value);
            }
            catch (error) {
                console.debug(`Failed to observe gauge ${name}:`, error);
            }
        });
    }
    catch (error) {
        console.debug(`Failed to create observable gauge ${name}:`, error);
    }
}
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
function startTimer(name, attributes, meterName) {
    const startTime = Date.now();
    return (resultAttrs) => {
        const duration = Date.now() - startTime;
        const finalAttrs = { ...attributes, ...resultAttrs };
        recordHistogram(name, duration, finalAttrs, meterName);
    };
}
//# sourceMappingURL=metrics.js.map