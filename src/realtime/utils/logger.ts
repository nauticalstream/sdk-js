/**
 * Simple console-based logger fallback for @nauticalstream/realtime
 * Services should pass their own logger via config.logger
 */
const noop = () => {};

export const defaultLogger = {
  info: typeof console !== 'undefined' ? console.info.bind(console) : noop,
  error: typeof console !== 'undefined' ? console.error.bind(console) : noop,
  warn: typeof console !== 'undefined' ? console.warn.bind(console) : noop,
  debug: typeof console !== 'undefined' ? console.debug.bind(console) : noop,
  child: () => defaultLogger,
};
