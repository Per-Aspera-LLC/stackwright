import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts', 'src/setup.ts'],
  target: 'es2022',
  format: ['cjs', 'esm'],
  dts: true, // We use tsc for declarations
  sourcemap: true,
  clean: true,
  external: ['react', 'react-dom', 'next'],
  outExtension({ format }) {
    return {
      js: format === 'cjs' ? '.js' : '.mjs',
    }
  }
});
