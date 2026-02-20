import type { Logger } from 'pino';
/**
 * Determine if an error should trigger a retry for NATS/JetStream operations
 */
export declare function shouldRetry(logger: Logger, subject: string, error: unknown): boolean;
//# sourceMappingURL=shouldRetry.d.ts.map