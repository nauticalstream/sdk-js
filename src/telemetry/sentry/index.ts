export { initSentry, getSentry, closeSentry } from './init.js';
export type { SentryConfig } from './config.js';
export { DEFAULT_SENTRY_CONFIG } from './config.js';

// Re-export Sentry SDK for manual usage
import { getSentry } from './init.js';
const { Sentry } = getSentry();
export { Sentry };
