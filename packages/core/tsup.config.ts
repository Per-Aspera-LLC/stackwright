import { defineConfig } from 'tsup';

export default defineConfig({
  entry: [
    'src/index.ts',
    'src/components/DynamicPage.ts',
    'src/pages/SlugPage.ts',
    // Carousel is a separate entry so '@stackwright/core/carousel' is a stable
    // subpath import and the async chunk has a deterministic name.
    'src/components/narrative/Carousel/Carousel.tsx',
    // Map is a separate entry so '@stackwright/core/map' is a stable
    // subpath import and the async chunk has a deterministic name.
    'src/components/base/Map.tsx',
    // CodeBlock is a separate entry so '@stackwright/core/code-block' is a
    // stable subpath import and the async chunk has a deterministic name.
    // PrismJS moves into this chunk automatically (it's only imported by CodeBlock).
    'src/components/base/CodeBlock.tsx',
    // Faq is a separate entry so '@stackwright/core/faq' is a stable
    // subpath import and the async chunk has a deterministic name.
    // @radix-ui/react-accordion moves into this chunk automatically.
    'src/components/base/Faq.tsx',
  ],
  format: ['cjs', 'esm'],
  target: 'es2022',
  dts: true, // TypeScript declarations handled separately
  // splitting: true enables esbuild to create a real async chunk for
  // React.lazy()-imported components (e.g. Carousel). Without splitting,
  // esbuild inlines all modules into one file and React.lazy resolves
  // via Promise.resolve() — which webpack cannot code-split.
  // Only affects ESM output; CJS stays as a single bundle.
  splitting: true,
  sourcemap: true,
  clean: true,
  external: [
    'react',
    'react-dom',
    '@stackwright/types',
    '@stackwright/themes',
    '@stackwright/collections',
  ],
  noExternal: ['prismjs'],
  outExtension({ format }) {
    return {
      js: format === 'cjs' ? '.js' : '.mjs',
    };
  },
});
