import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/__tests__/**/*.test.ts'],
    server: {
      deps: {
        // Process @nauticalstream packages through Vite so extension-less
        // relative imports in generated proto files resolve correctly
        inline: [/@nauticalstream\//],
      },
    },
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: ['src/**/__tests__/**', 'src/**/*.d.ts'],
      reporter: ['text', 'lcov'],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 75,
        statements: 80,
      },
    },
  },
});
