import { defineConfig } from 'tsup';
import fs from 'fs';
import path from 'path';

export default defineConfig({
  entry: {
    cli: 'src/cli.ts',
    index: 'src/index.ts',
  },
  format: ['cjs', 'esm'],
  dts: true,
  splitting: false,
  noExternal: [/^@stackwright\//],
  // CLI is Node.js-only. Force the `require` condition so CJS-only workspace
  // packages (e.g. @stackwright/build-scripts, which has no `import` export)
  // resolve correctly during the ESM format pass as well as the CJS pass.
  esbuildOptions(options) {
    if (!options.conditions) options.conditions = [];
    if (!options.conditions.includes('require')) {
      options.conditions.unshift('require');
    }
  },
  sourcemap: false,
  clean: true,
  outExtension({ format }) {
    return {
      js: format === 'cjs' ? '.js' : '.mjs',
    };
  },
  // Add shebang to cli.js only after build completes
  async onSuccess() {
    const cliPath = path.join(__dirname, 'dist', 'cli.js');
    const contents = fs.readFileSync(cliPath, 'utf8');
    if (!contents.startsWith('#!/usr/bin/env node')) {
      fs.writeFileSync(cliPath, '#!/usr/bin/env node\n' + contents, 'utf8');
    }
    // Ensure the file is executable
    fs.chmodSync(cliPath, 0o755);
  },
});
