/**
 * Browser stub for @nauticalstream/sdk/server/fastify
 * 
 * This module is only available in Node.js environments.
 * Fastify is a Node.js web framework and cannot run in browsers.
 */

const createBrowserError = (name: string) => {
  throw new Error(
    `${name} is only available in Node.js. Fastify server utilities are for backend services only.`
  );
};

export const createFastifyServer = (..._args: any[]): any => createBrowserError('createFastifyServer');
export const createUserContext = (..._args: any[]): any => createBrowserError('createUserContext');
export const createSystemContext = (..._args: any[]): any => createBrowserError('createSystemContext');
export const createContextFromEvent = (..._args: any[]): any => createBrowserError('createContextFromEvent');
export const withContext = (..._args: any[]): any => createBrowserError('withContext');
export const getContext = (..._args: any[]): any => createBrowserError('getContext');
export const createContext = (..._args: any[]): any => createBrowserError('createContext');
export const createContextBuilder = (..._args: any[]): any => createBrowserError('createContextBuilder');
export const fastifyTelemetry = (..._args: any[]): any => createBrowserError('fastifyTelemetry');
export const fastifyRequestLogging = (..._args: any[]): any => createBrowserError('fastifyRequestLogging');
export const fastifyObservability = (..._args: any[]): any => createBrowserError('fastifyObservability');
export const fastifyCors = (..._args: any[]): any => createBrowserError('fastifyCors');
export const createGraphQLPlugin = (..._args: any[]): any => createBrowserError('createGraphQLPlugin');
export const createHealthPlugin = (..._args: any[]): any => createBrowserError('createHealthPlugin');
export const fastifyErrorHandler = (..._args: any[]): any => createBrowserError('fastifyErrorHandler');
export const validateBody = (..._args: any[]): any => createBrowserError('validateBody');
export const validateQuery = (..._args: any[]): any => createBrowserError('validateQuery');
export const validateParams = (..._args: any[]): any => createBrowserError('validateParams');
export const mapZodError = (..._args: any[]): any => createBrowserError('mapZodError');
export const isZodError = (..._args: any[]): any => createBrowserError('isZodError');
