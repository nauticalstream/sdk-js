export const DEFAULT_CONFIG = {
    serviceVersion: process.env.npm_package_version ?? 'unknown',
    environment: process.env.NODE_ENV || 'development',
    instrumentations: {
        fastify: true,
        mongodb: true,
        http: true,
        dns: true,
        pg: true,
        redis: true,
        ioredis: true,
        graphql: false, // opt-in — high cardinality in large schemas
        pino: true,
        grpc: false, // opt-in — not every service uses gRPC
    },
    correlationId: {
        headerName: 'x-correlation-id',
        generateIfMissing: true,
    },
    sampling: {
        probability: 1.0,
    },
    resourceDetectors: 'auto',
    consoleExporter: false,
};
//# sourceMappingURL=config.js.map