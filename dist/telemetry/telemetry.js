import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter as OTLPHttpExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { OTLPTraceExporter as OTLPGrpcExporter } from '@opentelemetry/exporter-trace-otlp-grpc';
import { ConsoleSpanExporter, BatchSpanProcessor, ParentBasedSampler, TraceIdRatioBasedSampler } from '@opentelemetry/sdk-trace-node';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from '@opentelemetry/semantic-conventions';
import { trace, metrics, SpanStatusCode } from '@opentelemetry/api';
import { DEFAULT_CONFIG } from './config';
let sdk = null;
let isInitialized = false;
/**
 * Build instrumentations based on config
 * OTel v2 best practice: Use getNodeAutoInstrumentations for dynamic instrumentation setup
 * Note: Fastify instrumentation is provided by getNodeAutoInstrumentations from auto-instrumentations-node
 */
function buildInstrumentations(config) {
    const instConfig = config.instrumentations || DEFAULT_CONFIG.instrumentations || {};
    // getNodeAutoInstrumentations provides all standard instrumentations including:
    // - @fastify/otel (official Fastify instrumentation)
    // - MongoDB, HTTP, DNS, and many others
    return getNodeAutoInstrumentations({
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
export function initTelemetry(config) {
    if (isInitialized) {
        console.warn('Telemetry already initialized. Skipping re-initialization.');
        return;
    }
    const mergedConfig = {
        ...DEFAULT_CONFIG,
        ...config,
        instrumentations: {
            ...DEFAULT_CONFIG.instrumentations,
            ...config.instrumentations,
        },
        correlationId: {
            ...DEFAULT_CONFIG.correlationId,
            ...config.correlationId,
        },
        sampling: {
            ...DEFAULT_CONFIG.sampling,
            ...config.sampling,
        },
    };
    // Create resource with service metadata (OTel v2 API)
    const resource = resourceFromAttributes({
        [ATTR_SERVICE_NAME]: mergedConfig.serviceName,
        [ATTR_SERVICE_VERSION]: mergedConfig.serviceVersion || '1.0.0',
        'deployment.environment': mergedConfig.environment || 'development',
        ...mergedConfig.resource,
    });
    // Build instrumentations using factory pattern
    const instrumentations = buildInstrumentations(mergedConfig);
    // Configure trace exporters with BatchSpanProcessor for production efficiency
    const spanProcessors = [];
    if (mergedConfig.otlp) {
        const ExporterClass = mergedConfig.otlp.protocol === 'grpc' ? OTLPGrpcExporter : OTLPHttpExporter;
        console.log('[OTel] Configuring OTLP exporter:', {
            protocol: mergedConfig.otlp.protocol,
            endpoint: mergedConfig.otlp.endpoint,
        });
        const exporter = new ExporterClass({
            url: mergedConfig.otlp.endpoint,
            headers: mergedConfig.otlp.headers || {},
        });
        // BatchSpanProcessor: Groups spans and sends them in batches for better performance
        spanProcessors.push(new BatchSpanProcessor(exporter));
    }
    if (mergedConfig.consoleExporter) {
        spanProcessors.push(new BatchSpanProcessor(new ConsoleSpanExporter()));
    }
    // Configure sampler (OTel v2 best practice: ParentBased with TraceIdRatio)
    const sampler = new ParentBasedSampler({
        root: new TraceIdRatioBasedSampler(mergedConfig.sampling?.probability ?? 1.0),
    });
    // Initialize SDK with OTel v2 options
    sdk = new NodeSDK({
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
export async function shutdownTelemetry() {
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
export function getTracer(name) {
    return trace.getTracer(name || 'default');
}
/**
 * Get the meter for the application
 */
export function getMeter(name) {
    return metrics.getMeter(name || 'default');
}
/**
 * Create a span with the given name and execute a function
 * OTel v2 best practice: Use context-aware span handling with error recording
 * @param name - The span name
 * @param fn - The async function to execute within the span
 * @param tracerName - Optional tracer name (defaults to 'default')
 * @param attributes - Optional span attributes to set
 */
export async function withSpan(name, fn, tracerName, attributes) {
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
            span.setStatus({ code: SpanStatusCode.OK });
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
                code: SpanStatusCode.ERROR,
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
export const tracer = trace.getTracer('@nauticalstream/telemetry');
export const meter = metrics.getMeter('@nauticalstream/telemetry');
//# sourceMappingURL=telemetry.js.map