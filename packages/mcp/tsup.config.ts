import { defineConfig } from 'tsup';
import fs from 'fs';
import path from 'path';

export default defineConfig({
  entry: {
    server: 'src/server.ts',
    register: 'src/register.ts',
  },
  format: ['cjs'],
  // Only emit .d.ts for register.ts — server.ts is a binary entrypoint and
  // its Node globals (process, console) upset the DTS type-checker under lib:[es2020].
  dts: { entry: { register: 'src/register.ts' } },
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
