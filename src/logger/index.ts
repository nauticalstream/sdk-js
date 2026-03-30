/**
 * @nauticalstream/sdk - Logger Module
 * 
 * Logger types and utilities for all environments.
 * 
 * @example
 * ```typescript
 * import { createPinoLogger, type Logger } from '@nauticalstream/sdk/logger';
 * 
 * // Services (default - uses pino)
 * const logger = createPinoLogger({ name: 'my-service', level: 'info' });
 * 
 * // Lightweight console logger
 * import { createConsoleLogger } from '@nauticalstream/sdk/logger';
 * const logger = createConsoleLogger({ service: 'my-app' });
 * ```
 */

export type { Logger } from './types';
export { createPinoLogger } from './pino';
export { createConsoleLogger } from './console';
