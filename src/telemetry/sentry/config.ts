export interface SentryConfig {
  /** Sentry DSN from environment */
  dsn: string;
  
  /** Environment: production, staging, development */
  environment: string;
  
  /** Git commit SHA or version string */
  release?: string;
  
  /** Sample rate for performance traces (0.0 to 1.0) */
  tracesSampleRate?: number;
  
  /** Sample rate for profiling (0.0 to 1.0) */
  profilesSampleRate?: number;
  
  /** Enable/disable Sentry */
  enabled?: boolean;
  
  /** Error patterns to ignore */
  ignoreErrors?: (string | RegExp)[];
  
  /** Custom event filter */
  beforeSend?: (event: any, hint?: any) => any | null;
}

export const DEFAULT_SENTRY_CONFIG: Partial<SentryConfig> = {
  environment: process.env.NODE_ENV || 'development',
  tracesSampleRate: 0.1,  // 10% of transactions
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
