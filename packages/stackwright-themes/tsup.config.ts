import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: false, // Disable type generation temporarily
  splitting: false,
  sourcemap: true,
  clean: true,
});