"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_CONFIG = void 0;
exports.DEFAULT_CONFIG = {
    serviceVersion: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    instrumentations: {
        fastify: true,
        mongodb: true,
        http: true,
        dns: true,
    },
    correlationId: {
        headerName: 'x-correlation-id',
        generateIfMissing: true,
    },
    sampling: {
        probability: 1.0,
    },
    consoleExporter: process.env.NODE_ENV === 'development',
};
//# sourceMappingURL=config.js.map