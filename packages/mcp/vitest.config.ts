import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      // @stackwright/build-scripts only publishes a CJS `require` condition.
      // Vite 7 refuses to resolve packages that have an `exports` map with no
      // matching condition — it won't fall back to `main`. This alias points
      // to a local stub so the test runner can load render.ts at all.
      // The stub only matters for tests that import render-related modules;
      // the real package is used at runtime via the built CJS bundle.
      '@stackwright/build-scripts': path.resolve(__dirname, 'test/__mocks__/build-scripts.ts'),
    },
  },
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'json-summary', 'html'],
      reportsDirectory: './coverage',
      exclude: [
        'dist/**',
        'test/**',
        '**/*.test.ts',
        '**/*.test.tsx',
        '**/*.spec.ts',
        '**/*.spec.tsx',
      ],
    },
  },
});
