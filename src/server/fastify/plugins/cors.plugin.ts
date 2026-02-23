import fp from 'fastify-plugin';
import type { FastifyPluginAsync } from 'fastify';
import type { FastifyServerOptions } from '../types';

export type CorsOptions = NonNullable<FastifyServerOptions['cors']>;

export interface FastifyCorsPluginOptions {
  cors: CorsOptions;
}

/**
 * Registers @fastify/cors with the given options.
 *
 * Extracted from the factory into a proper `fp`-wrapped plugin so it is
 * consistent with the telemetry and logging plugins, composable in any order,
 * and independently testable.
 */
const fastifyCorsPlugin: FastifyPluginAsync<FastifyCorsPluginOptions> = async (fastify, opts) => {
  const { default: cors } = await import('@fastify/cors');
  const corsOptions = typeof opts.cors === 'boolean' ? { origin: true } : opts.cors;
  await fastify.register(cors, corsOptions);
};

export const fastifyCors = fp(fastifyCorsPlugin, {
  name: 'fastify-cors',
  fastify: '5.x',
});
