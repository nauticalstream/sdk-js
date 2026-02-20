"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fastifyTelemetry = void 0;
const api_1 = require("@opentelemetry/api");
const context_js_1 = require("../utils/context.js");
const DEFAULT_OPTIONS = {
    correlationIdHeader: 'x-correlation-id',
    generateIfMissing: true,
};
/**
 * Fastify plugin for correlation ID extraction and propagation
 * OTel v2 optimized: Properly handles context lifecycle across async request handlers
 */
const fastifyTelemetry = async (fastify, opts) => {
    const options = { ...DEFAULT_OPTIONS, ...opts };
    const headerName = options.correlationIdHeader.toLowerCase();
    /**
     * onRequest hook: Extract and set correlation ID
     * This runs at the beginning of request processing
     */
    fastify.addHook('onRequest', async (request) => {
        // Extract correlation ID from incoming request headers
        let correlationId = request.headers[headerName];
        // Generate new one if missing and configured to do so
        if (!correlationId && options.generateIfMissing) {
            correlationId = (0, context_js_1.generateCorrelationId)();
        }
        // Store correlation ID on request object for access throughout lifecycle
        request.correlationId = correlationId;
        // Set in OpenTelemetry context for this request's async context
        // OTel v2 automatically maintains async context through the request
        if (correlationId) {
            const ctx = (0, context_js_1.setCorrelationId)(correlationId);
            // Execute the rest of the request within this context
            await api_1.context.with(ctx, async () => {
                // Handler execution continues in this context
                return Promise.resolve();
            });
        }
    });
    /**
     * onSend hook: Add correlation ID to response headers
     * This runs when the response is being sent
     */
    fastify.addHook('onSend', async (request, reply) => {
        // Get correlation ID from request (set in onRequest)
        const correlationId = request.correlationId || (0, context_js_1.getCorrelationId)();
        // Add to response headers if not already present
        if (correlationId && !reply.hasHeader(headerName)) {
            reply.header(headerName, correlationId);
        }
    });
    /**
     * Decorate request with correlationId property for easy access in handlers
     * @example
     * ```typescript
     * // In a route handler:
     * fastify.get('/', (request, reply) => {
     *   const correlationId = request.correlationId;
     * });
     * ```
     */
    fastify.decorateRequest('correlationId', {
        getter() {
            return this.correlationId;
        },
    });
};
exports.fastifyTelemetry = fastifyTelemetry;
exports.default = exports.fastifyTelemetry;
//# sourceMappingURL=fastify-telemetry.plugin.js.map