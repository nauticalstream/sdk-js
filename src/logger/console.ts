import type { Logger } from './types.js';

/**
 * Simple console-based logger implementation
 * Used as fallback when no logger is provided
 * Works in runtime environments without pino
 */
class ConsoleLogger implements Logger {
  public level: string = 'info';
  private bindings: Record<string, any>;

  constructor(bindings: Record<string, any> = {}) {
    this.bindings = bindings;
  }

  private log(level: string, method: 'info' | 'error' | 'warn' | 'debug' | 'trace', ...args: any[]): void {
    if (typeof console === 'undefined') return;

    const [first, ...rest] = args;
    const obj = typeof first === 'object' && first !== null && !Array.isArray(first) ? first : null;
    const message = obj ? rest : args;

    const context = { ...this.bindings, ...(obj || {}) };
    const hasContext = Object.keys(context).length > 0;

    if (hasContext) {
      console[method](`[${level.toUpperCase()}]`, context, ...message);
    } else {
      console[method](`[${level.toUpperCase()}]`, ...message);
    }
  }

  info(...args: any[]): void {
    this.log('info', 'info', ...args);
  }

  error(...args: any[]): void {
    this.log('error', 'error', ...args);
  }

  warn(...args: any[]): void {
    this.log('warn', 'warn', ...args);
  }

  debug(...args: any[]): void {
    this.log('debug', 'debug', ...args);
  }

  trace(...args: any[]): void {
    const method = typeof (console as any).trace === 'function' ? 'trace' : 'debug';
    this.log('trace', method as any, ...args);
  }

  fatal(...args: any[]): void {
    this.log('fatal', 'error', ...args);
  }

  silent(..._args: any[]): void {
    // No-op for silent
  }

  child(bindings: object, _options?: object): Logger {
    return new ConsoleLogger({ ...this.bindings, ...bindings });
  }
}

/**
 * Create a console-based logger
 * @param bindings - Initial bindings (e.g., { service: 'my-service' })
 */
export function createConsoleLogger(bindings: Record<string, any> = {}): Logger {
  return new ConsoleLogger(bindings);
}
