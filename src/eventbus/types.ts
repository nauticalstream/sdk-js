/** Options for publishing messages. */
export interface PublishOptions {
  /** Correlation ID propagated across related events. Auto-generated if omitted. */
  correlationId?: string;
}

/** Options for subscribing to messages. */
export interface SubscribeOptions {
  // Reserved for future enhancements (filtering, middleware).
}

/** Options for queue group subscriptions. */
export interface QueueGroupOptions {
  /** NATS queue group name — only one member receives each message. */
  queueGroupName: string;
}

/** Options for request/reply RPC calls. */
export interface RequestOptions {
  /** Timeout in milliseconds. Defaults to DEFAULT_REQUEST_TIMEOUT_MS. */
  timeoutMs?: number;
  /** Correlation ID for tracing the request/response pair. */
  correlationId?: string;
}

/** Options for reply (RPC server-side) handlers. */
export interface ReplyOptions {
  // Reserved for future enhancements.
}

/** Cleanup function returned by all subscribe operations. Call to stop consuming. */
export type Unsubscribe = () => void;
