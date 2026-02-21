import fp from 'fastify-plugin';
import mercuriusFederation from '@mercuriusjs/federation';
import type { FastifyInstance } from 'fastify';
import type { GraphQLPluginOptions } from '../types';
import { createGraphQLErrorFormatter } from '../errors/formatter';

/**
 * Creates a Mercurius GraphQL Federation plugin with automatic error formatting.
 *
 * @example
 * await server.register(createGraphQLPlugin({
 *   schema: readFileSync('./schema.graphql', 'utf-8'),
 *   resolvers,
 *   context: createContext,
 * }));
 */
export function createGraphQLPlugin(options: GraphQLPluginOptions) {
  async function graphqlPlugin(fastify: FastifyInstance): Promise<void> {
    await fastify.register(mercuriusFederation as any, {
      schema: options.schema,
      resolvers: options.resolvers,
      graphiql: options.graphiql ?? false,
      path: options.path ?? '/graphql',
      errorFormatter: createGraphQLErrorFormatter(),
      context: options.context,
    });
  }

  return fp(graphqlPlugin, {
    name: 'fastify-graphql',
    fastify: '5.x',
  });
}
