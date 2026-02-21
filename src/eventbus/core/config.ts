/**
 * EventBus module configuration
 * Re-exports resilience config for consistency
 */

export type { RetryConfig } from '../../resilience';
export { DEFAULT_RETRY_CONFIG } from '../../resilience';

/**
 * Default timeout for request/reply RPC calls in milliseconds
 */
export const DEFAULT_REQUEST_TIMEOUT_MS = 5000;
