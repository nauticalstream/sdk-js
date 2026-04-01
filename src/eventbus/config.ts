export type { RetryConfig } from '../resilience/index.js';
export { DEFAULT_RETRY_CONFIG } from '../resilience/index.js';

/** Default timeout for NATS request/reply RPC calls. */
export const DEFAULT_REQUEST_TIMEOUT_MS = 5000;
