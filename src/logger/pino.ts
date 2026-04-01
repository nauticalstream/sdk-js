import pino, { type LoggerOptions } from 'pino';
import type { Logger } from './types.js';

/**
 * Options for creating a pino logger with telemetry
 */
export interface PinoLoggerOptions extends LoggerOptions {
  name?: string;
}

/**
 * Create a pino logger
 * This is the default logger for Node.js services
 * 
 * For telemetry integration (trace/span/correlation IDs), use createLogger from @nauticalstream/sdk/telemetry
 * 
 * @param options - Pino logger options
 * @returns Pino logger instance
 * 
 * @example
 * ```typescript
 * import { createPinoLogger } from '@nauticalstream/sdk/logger';
 * 
 * const logger = createPinoLogger({ 
 *   name: 'my-service',
 *   level: 'info' 
 * });
 * 
 * logger.info({ userId: '123' }, 'User logged in');
 * ```
 */
export function createPinoLogger(options: PinoLoggerOptions = {}): Logger {
  return pino(options) as Logger;
}
