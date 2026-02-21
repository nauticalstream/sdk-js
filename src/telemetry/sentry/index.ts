export { initSentry, getSentry, closeSentry } from './init';
export type { SentryConfig } from './config';
export { DEFAULT_SENTRY_CONFIG } from './config';

// Re-export Sentry SDK for manual usage
import { getSentry } from './init';
const { Sentry } = getSentry();
export { Sentry };
