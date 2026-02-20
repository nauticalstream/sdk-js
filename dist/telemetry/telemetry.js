"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.meter = exports.tracer = void 0;
exports.initTelemetry = initTelemetry;
exports.shutdownTelemetry = shutdownTelemetry;
exports.getTracer = getTracer;
exports.getMeter = getMeter;
exports.withSpan = withSpan;
const sdk_node_1 = require("@opentelemetry/sdk-node");
const auto_instrumentations_node_1 = require("@opentelemetry/auto-instrumentations-node");
const exporter_trace_otlp_http_1 = require("@opentelemetry/exporter-trace-otlp-http");
const exporter_trace_otlp_grpc_1 = require("@opentelemetry/exporter-trace-otlp-grpc");
const sdk_trace_node_1 = require("@opentelemetry/sdk-trace-node");
const resources_1 = require("@opentelemetry/resources");
const semantic_conventions_1 = require("@opentelemetry/semantic-conventions");
const api_1 = require("@opentelemetry/api");
const config_js_1 = require("./config.js");
let sdk = null;
let isInitialized = false;
/**
 * Build instrumentations based on config
 * OTel v2 best practice: Use getNodeAutoInstrumentations for dynamic instrumentation setup
 * Note: Fastify instrumentation is provided by getNodeAutoInstrumentations from auto-instrumentations-node
 */
function buildInstrumentations(config) {
    const instConfig = config.instrumentations || config_js_1.DEFAULT_CONFIG.instrumentations || {};
    // getNodeAutoInstrumentations provides all standard instrumentations including:
    // - @fastify/otel (official Fastify instrumentation)
    // - MongoDB, HTTP, DNS, and many others
    return (0, auto_instrumentations_node_1.getNodeAutoInstrumentations)({
        '@opentelemetry/instrumentation-fastify': {
            enabled: instConfig.fastify !== false,
            ...(typeof instConfig.fastify === 'object' && instConfig.fastify),
        },
        '@opentelemetry/instrumentation-mongodb': {
            enabled: instConfig.mongodb !== false,
            ...(typeof instConfig.mongodb === 'object' && instConfig.mongodb),
        },
        '@opentelemetry/instrumentation-http': {
            enabled: instConfig.http !== false,
            ...(typeof instConfig.http === 'object' && instConfig.http),
        },
        '@opentelemetry/instrumentation-dns': {
            enabled: instConfig.dns !== false,
            ...(typeof instConfig.dns === 'object' && instConfig.dns),
        },
    });
}
/**
 * Initialize OpenTelemetry SDK with the provided configuration
 * OTel v2 optimized initialization with BatchSpanProcessor for production
 */
function initTelemetry(config) {
    if (isInitialized) {
        console.warn('Telemetry already initialized. Skipping re-initialization.');
        return;
    }
    const mergedConfig = {
        ...config_js_1.DEFAULT_CONFIG,
        ...config,
        instrumentations: {
            ...config_js_1.DEFAULT_CONFIG.instrumentations,
            ...config.instrumentations,
        },
        correlationId: {
            ...config_js_1.DEFAULT_CONFIG.correlationId,
            ...config.correlationId,
        },
        sampling: {
            ...config_js_1.DEFAULT_CONFIG.sampling,
            ...config.sampling,
        },
    };
    // Create resource with service metadata (OTel v2 API)
    const resource = (0, resources_1.resourceFromAttributes)({
        [semantic_conventions_1.ATTR_SERVICE_NAME]: mergedConfig.serviceName,
        [semantic_conventions_1.ATTR_SERVICE_VERSION]: mergedConfig.serviceVersion || '1.0.0',
        'deployment.environment': mergedConfig.environment || 'development',
        ...mergedConfig.resource,
    });
    // Build instrumentations using factory pattern
    const instrumentations = buildInstrumentations(mergedConfig);
    // Configure trace exporters with BatchSpanProcessor for production efficiency
    const spanProcessors = [];
    if (mergedConfig.otlp) {
        const ExporterClass = mergedConfig.otlp.protocol === 'grpc' ? exporter_trace_otlp_grpc_1.OTLPTraceExporter : exporter_trace_otlp_http_1.OTLPTraceExporter;
        const exporter = new ExporterClass({
            url: mergedConfig.otlp.endpoint,
            headers: mergedConfig.otlp.headers || {},
        });
        // BatchSpanProcessor: Groups spans and sends them in batches for better performance
        spanProcessors.push(new sdk_trace_node_1.BatchSpanProcessor(exporter));
    }
    if (mergedConfig.consoleExporter) {
        spanProcessors.push(new sdk_trace_node_1.BatchSpanProcessor(new sdk_trace_node_1.ConsoleSpanExporter()));
    }
    // Configure sampler (OTel v2 best practice: ParentBased with TraceIdRatio)
    const sampler = new sdk_trace_node_1.ParentBasedSampler({
        root: new sdk_trace_node_1.TraceIdRatioBasedSampler(mergedConfig.sampling?.probability ?? 1.0),
    });
    // Initialize SDK with OTel v2 options
    sdk = new sdk_node_1.NodeSDK({
        resource,
        instrumentations,
        spanProcessors,
        sampler,
    });
    sdk.start();
    isInitialized = true;
    // Graceful shutdown
    process.on('SIGTERM', async () => {
        await shutdownTelemetry();
    });
    console.log(`OpenTelemetry initialized for ${mergedConfig.serviceName} v${mergedConfig.serviceVersion}`);
}
/**
 * Shutdown the OpenTelemetry SDK gracefully
 */
async function shutdownTelemetry() {
    if (!sdk) {
        return;
    }
    try {
        await sdk.shutdown();
        console.log('OpenTelemetry shutdown complete');
    }
    catch (error) {
        console.error('Error shutting down OpenTelemetry:', error);
    }
    finally {
        sdk = null;
        isInitialized = false;
    }
}
/**
 * Get the tracer for the application
 */
function getTracer(name) {
    return api_1.trace.getTracer(name || 'default');
}
/**
 * Get the meter for the application
 */
function getMeter(name) {
    return api_1.metrics.getMeter(name || 'default');
}
/**
 * Create a span with the given name and execute a function
 * OTel v2 best practice: Use context-aware span handling with error recording
 * @param name - The span name
 * @param fn - The async function to execute within the span
 * @param tracerName - Optional tracer name (defaults to 'default')
 * @param attributes - Optional span attributes to set
 */
async function withSpan(name, fn, tracerName, attributes) {
    const tracer = getTracer(tracerName);
    return tracer.startActiveSpan(name, async (span) => {
        try {
            // Set initial attributes if provided
            if (attributes) {
                Object.entries(attributes).forEach(([key, value]) => {
                    if (value !== null && value !== undefined) {
                        try {
                            span.setAttribute(key, value);
                        }
                        catch (err) {
                            // Skip attributes that can't be serialized
                            console.debug(`Failed to set span attribute ${key}:`, err);
                        }
                    }
                });
            }
            // Add code location context from stack trace
            try {
                const error = new Error();
                const stack = error.stack?.split('\n') ?? [];
                if (stack.length > 1) {
                    const caller = stack[2]?.trim() ?? 'unknown';
                    const functionMatch = caller.match(/at (.+) \(/);
                    const functionName = functionMatch?.[1] ?? name;
                    span.setAttribute('code.function', functionName);
                    span.setAttribute('code.namespace', '@nauticalstream/telemetry');
                }
            }
            catch (err) {
                // Continue without stack extraction if it fails
            }
            // Record operation start event
            span.addEvent('operation_started');
            const result = await fn();
            // Mark successful completion
            span.setStatus({ code: api_1.SpanStatusCode.OK });
            span.addEvent('operation_completed');
            return result;
        }
        catch (error) {
            // Record exception with full context (OTel v2 best practice)
            if (error instanceof Error) {
                span.recordException(error);
                span.setAttribute('error.type', error.name);
                span.setAttribute('error.message', error.message);
                // Store stack trace (first 5 lines) as string attribute for debugging
                if (error.stack) {
                    const stackLines = error.stack.split('\n').slice(0, 5).join('\n');
                    span.setAttribute('error.stack', stackLines);
                }
            }
            else {
                span.recordException(new Error(String(error)));
                span.setAttribute('error.type', typeof error);
                span.setAttribute('error.message', String(error));
            }
            // Set error status with message (limited to 255 chars per OTel spec)
            const errorMessage = error instanceof Error
                ? error.message
                : typeof error === 'string'
                    ? error
                    : 'Unknown error';
            span.setStatus({
                code: api_1.SpanStatusCode.ERROR,
                message: errorMessage.substring(0, 255),
            });
            throw error;
        }
        finally {
            span.end();
        }
    });
}
/**
 * Export tracer and meter directly
 */
exports.tracer = api_1.trace.getTracer('@nauticalstream/telemetry');
exports.meter = api_1.metrics.getMeter('@nauticalstream/telemetry');
//# sourceMappingURL=telemetry.js.map