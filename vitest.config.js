import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: false,
    setupFiles: ['./tests/unit/unit-env-setup.js'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      thresholds: { lines: 75, branches: 70, functions: 75, statements: 75 },
      exclude: ['tests/**', '**/*.config.js', 'src/tracing.js', 'src/server.js'],
    },
    testTimeout: 15000,
    hookTimeout: 30000,
  },
});
