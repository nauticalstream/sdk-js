export const DEFAULT_SENTRY_CONFIG = {
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: 0.1,
    profilesSampleRate: 0.0, // profiling disabled unless profiling:true is set
    profiling: false,
    enabled: false,
    ignoreErrors: [
        'ValidationError',
        'NotFoundError',
        'UnauthorizedError',
        /ECONNREFUSED/,
        /ETIMEDOUT/,
    ],
};
//# sourceMappingURL=config.js.map