import { defineConfig, type Options } from 'tsup';

const config: Options = {
  entry: ['src/types/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  clean: true,
  sourcemap: true,
  outExtension({ format }) {
    return {
      js: format === 'cjs' ? '.js' : '.mjs',
    };
  },
};

export default defineConfig(config);
