import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts', 'src/components/DynamicPage.ts', 'src/pages/SlugPage.ts'],
  format: ['cjs', 'esm'],
  target: 'es2022',
  dts: true, // TypeScript declarations handled separately
  splitting: false,
  sourcemap: true,
  clean: true,
  external: ['react', 'react-dom', '@stackwright/types', '@stackwright/themes', '@stackwright/collections'],
  noExternal: ['prismjs'],
  outExtension({ format }) {
    return {
      js: format === 'cjs' ? '.js' : '.mjs',
    };
  },
});
