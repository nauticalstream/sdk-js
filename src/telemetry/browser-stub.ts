/**
 * Browser stub for @nauticalstream/sdk/telemetry
 * 
 * This module is only available in Node.js environments.
 * Use conditional imports or check environment before importing.
 */

const createBrowserError = (name: string) => {
  throw new Error(
    `${name} is only available in Node.js. This module uses native dependencies (@sentry/node, OpenTelemetry) that cannot run in browsers.`
  );
};

export const initTelemetry = (..._args: any[]): any => createBrowserError('initTelemetry');
export const shutdownTelemetry = (..._args: any[]): any => createBrowserError('shutdownTelemetry');
export const registerShutdownHooks = (..._args: any[]): any => createBrowserError('registerShutdownHooks');
export const getTracer = (..._args: any[]): any => createBrowserError('getTracer');
export const getMeter = (..._args: any[]): any => createBrowserError('getMeter');
export const withSpan = (..._args: any[]): any => createBrowserError('withSpan');
export const tracer: any = createBrowserError('tracer');
export const meter: any = createBrowserError('meter');
