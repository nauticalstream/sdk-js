export const DEFAULT_SENTRY_CONFIG = {
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: 0.1, // 10% of transactions
    profilesSampleRate: 0.1, // 10% of transactions
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