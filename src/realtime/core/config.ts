import type { Logger } from '../../logger/index.js';
import type { RetryConfig } from '../../resilience/index.js';

export type RealtimePasswordFactory = () => string | Promise<string>;

/**
 * Realtime module configuration
 * Re-exports resilience config for consistency
 */

export type { RetryConfig } from '../../resilience/index.js';
export { DEFAULT_RETRY_CONFIG } from '../../resilience/index.js';

/**
 * MQTT Quality of Service levels
 */
export type QoS = 0 | 1 | 2;

/**
 * Options for MQTT publish operations
 */
export interface PublishOptions {
  qos?: QoS;
  retain?: boolean;
  correlationId?: string;
}

/**
 * Configuration for RealtimeClient instance
 */
export interface RealtimeClientConfig {
  brokerUrl: string;
  name: string;
  logger?: Logger;
  clientId?: string;
  username?: string;
  password?: string;
  passwordFactory?: RealtimePasswordFactory;
  reconnectPeriod?: number;
  connectTimeout?: number;
  clean?: boolean;
  keepalive?: number;
  /** Retry configuration for publish operations. Uses defaults if not provided. */
  retryConfig?: RetryConfig;
}
