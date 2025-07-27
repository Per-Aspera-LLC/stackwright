import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts', 'src/setup.ts'],
  format: ['cjs', 'esm'],
  dts: false, // We use tsc for declarations
  sourcemap: true,
  clean: true,
  external: ['react', 'react-dom', 'next'],
});
