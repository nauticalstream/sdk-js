import type { FastifyPluginAsync } from 'fastify';
export interface FastifyTelemetryOptions {
    correlationIdHeader?: string;
    generateIfMissing?: boolean;
}
/**
 * Fastify plugin for correlation ID extraction and propagation
 * OTel v2 optimized: Properly handles context lifecycle across async request handlers
 */
export declare const fastifyTelemetry: FastifyPluginAsync<FastifyTelemetryOptions>;
export default fastifyTelemetry;
//# sourceMappingURL=fastify-telemetry.plugin.d.ts.map