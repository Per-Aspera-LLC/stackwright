#!/usr/bin/env node
/**
 * generate-lucide-exports.mjs
 *
 * Regenerates src/compile/lucide-exports.json from the installed lucide-react
 * package's TypeScript declaration file.  Run this whenever lucide-react is
 * updated in the workspace.
 *
 * Usage (from packages/build-scripts/):
 *   node scripts/generate-lucide-exports.mjs
 */

import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

// Resolve lucide-react relative to this package (not the workspace root).
// Falls back to workspace root node_modules if not hoisted here.
let lucidePkgPath;
try {
  lucidePkgPath = require.resolve('lucide-react/dist/lucide-react.d.ts', {
    paths: [path.join(__dirname, '..')],
  });
} catch {
  lucidePkgPath = require.resolve('lucide-react/dist/lucide-react.d.ts', {
    paths: [path.join(__dirname, '..', '..', '..')],
  });
}

const content = fs.readFileSync(lucidePkgPath, 'utf8');

// The .d.ts has one big `export { A, B as C, ... }` block.
// We collect EVERY identifier that appears in that block — both the
// canonical name (left of `as`) and the alias (right of `as`) — so that
// our allow-list covers deprecated aliases like HelpCircle and AlertTriangle.
const match = content.match(/^export \{([^}]+)\}/m);
if (!match) {
  console.error('ERROR: Could not find export block in', lucidePkgPath);
  process.exit(1);
}

const names = new Set();
for (const token of match[1].split(',').map((s) => s.trim()).filter(Boolean)) {
  for (const part of token.split(' as ')) {
    const name = part.trim();
    if (/^[A-Z][A-Za-z0-9]*$/.test(name)) {
      names.add(name);
    }
  }
}

const sorted = [...names].sort();
const outPath = path.join(__dirname, '..', 'src', 'compile', 'lucide-exports.json');
fs.writeFileSync(outPath, JSON.stringify(sorted, null, 2) + '\n');

console.log(`Written ${sorted.length} names to ${path.relative(process.cwd(), outPath)}`);
