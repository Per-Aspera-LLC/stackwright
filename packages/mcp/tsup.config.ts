import { defineConfig } from 'tsup';
import fs from 'fs';
import path from 'path';

export default defineConfig({
  entry: {
    server: 'src/server.ts',
  },
  format: ['cjs'],
  dts: false,
  splitting: false,
  sourcemap: false,
  clean: true,
  async onSuccess() {
    const serverPath = path.join(__dirname, 'dist', 'server.js');
    const contents = fs.readFileSync(serverPath, 'utf8');
    if (!contents.startsWith('#!/usr/bin/env node')) {
      fs.writeFileSync(serverPath, '#!/usr/bin/env node\n' + contents, 'utf8');
    }
    fs.chmodSync(serverPath, 0o755);
  },
});
