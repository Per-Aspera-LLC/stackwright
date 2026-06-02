import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts', 'src/schemas.ts', 'src/color-mode-script.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  target: 'es2022',
  splitting: false,
  sourcemap: true,
  clean: true,
  outExtension({ format }) {
    return {
      js: format === 'cjs' ? '.js' : '.mjs',
    };
  },
});
