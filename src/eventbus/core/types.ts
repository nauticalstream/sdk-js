/**
 * Options for publishing messages
 */
export interface PublishOptions {
  /** Optional correlation ID for tracing related events */
  correlationId?: string;
}

/**
 * Options for subscribing to messages
 */
export interface SubscribeOptions {
  // Reserved for future enhancements (e.g., filtering, middleware)
}

/**
 * Options for queue group subscriptions
 */
export interface QueueGroupOptions {
  /** Name of the queue group for load balancing */
  queueGroupName: string;
}

/**
 * Options for request/reply operations
 */
export interface RequestOptions {
  /** Request timeout in milliseconds (default: DEFAULT_REQUEST_TIMEOUT_MS) */
  timeoutMs?: number;
  /** Optional correlation ID for tracing */
  correlationId?: string;
}

/**
 * Options for reply handlers
 */
export interface ReplyOptions {
  // Reserved for future enhancements (e.g., middleware, validation)
}

/**
 * Cleanup function returned by subscribe operations
 */
export type Unsubscribe = () => void;
