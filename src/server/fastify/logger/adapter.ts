import type { FastifyBaseLogger } from 'fastify';
import type { Bindings, ChildLoggerOptions } from 'pino';
import { createLogger } from '../../../telemetry/utils/logging';

export type TelemetryLogger = ReturnType<typeof createLogger>;

/**
 * Adapts a Pino-based telemetry logger to the FastifyBaseLogger interface.
 *
 * Fastify requires its own logger shape; this adapter bridges the two without
 * spawning a second logger instance. The adapter is recursive — `child()`
 * returns a new adapter wrapping a Pino child logger, so Fastify's per-request
 * child loggers automatically inherit the correlationId mixin from the telemetry
 * logging setup.
 *
 * Extracted out of `factory.ts` so it can be unit-tested independently.
 */
export function createFastifyLoggerAdapter(logger: TelemetryLogger): FastifyBaseLogger {
  return {
    level: logger.level,
    fatal: logger.fatal.bind(logger),
    error: logger.error.bind(logger),
    warn: logger.warn.bind(logger),
    info: logger.info.bind(logger),
    debug: logger.debug.bind(logger),
    trace: logger.trace.bind(logger),
    silent: logger.silent?.bind(logger) ?? (() => {}),
    child(bindings: Bindings, options?: ChildLoggerOptions): FastifyBaseLogger {
      return createFastifyLoggerAdapter(logger.child(bindings, options));
    },
  } as FastifyBaseLogger;
}
