import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts', 'src/components/DynamicPage.ts', 'src/pages/SlugPage.ts'],
  format: ['cjs', 'esm'],
  target: 'es2020',
  dts: false, // TypeScript declarations handled separately
  splitting: false,
  sourcemap: true,
  clean: true,
  external: ['react', 'react-dom', '@mui/material', '@mui/icons-material', '@emotion/react', '@emotion/styled'],
});
