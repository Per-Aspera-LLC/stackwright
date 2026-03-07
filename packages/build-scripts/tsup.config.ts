import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    prebuild: 'src/prebuild.ts',
    watch: 'src/watch.ts',
    index: 'src/index.ts',
  },
  format: ['cjs'],
  target: 'node20',
  dts: true,
  splitting: false,
  sourcemap: false,
  clean: true,
  // Node built-ins are always available at runtime — never bundle them
  external: ['fs', 'path', 'url', 'process', 'http'],
  // Shebang is prepended to the prebuild CLI entry
  banner: {
    js: '#!/usr/bin/env node',
  },
});
