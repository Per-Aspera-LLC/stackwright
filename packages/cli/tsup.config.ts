import { defineConfig } from 'tsup';
import fs from 'fs';
import path from 'path';

export default defineConfig({
  entry: {
    cli: 'src/cli.ts',
    index: 'src/index.ts',
  },
  format: ['cjs'],
  dts: true,
  splitting: false,
  sourcemap: false,
  clean: true,
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
