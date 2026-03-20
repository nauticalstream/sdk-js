import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'browser-index': 'src/browser-index.ts',
    'logger/index': 'src/logger/index.ts',
    'telemetry/index': 'src/telemetry/index.ts',
    'telemetry/browser-stub': 'src/telemetry/browser-stub.ts',
    'errors/index': 'src/errors/index.ts',
    'eventbus/index': 'src/eventbus/index.ts',
    'eventbus/browser-stub': 'src/eventbus/browser-stub.ts',
    'permissions/index': 'src/permissions/index.ts',
    'crypto/index': 'src/crypto/index.ts',
    'realtime/index': 'src/realtime/index.ts',
    'resilience/index': 'src/resilience/index.ts',
    'server/fastify/index': 'src/server/fastify/index.ts',
    'server/fastify/browser-stub': 'src/server/fastify/browser-stub.ts',
    'workspace/index': 'src/workspace/index.ts',
  },
  format: ['esm'],
  dts: true,
  sourcemap: true,
  clean: true,
  splitting: false,
  treeshake: false,
  outDir: 'dist',
  platform: 'node',
  target: 'es2022',
  skipNodeModulesBundle: true,
  external: [
    '@sentry/node',
    '@sentry/profiling-node',
    '@sentry-internal/node-cpu-profiler'
  ],
  shims: false,
});
