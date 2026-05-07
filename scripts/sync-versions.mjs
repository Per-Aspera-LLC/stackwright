#!/usr/bin/env node
/**
 * sync-versions.mjs
 *
 * Keeps the VERSIONS constant in packages/cli/src/utils/template-processor.ts
 * in sync with the actual package versions in the workspace.
 *
 * Run before cutting a release:
 *   node scripts/sync-versions.mjs
 *
 * Or add to the release workflow so stale scaffold templates are caught automatically.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

/** Read a package.json and return its version string. */
function readVersion(packageDir) {
  const pkgPath = path.join(root, 'packages', packageDir, 'package.json');
  if (!fs.existsSync(pkgPath)) return null;
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  return pkg.version ?? null;
}

/** Convert a semver like "0.8.2" to a conservative range "^0.8.0". */
function toRange(version) {
  const [major, minor] = version.split('.');
  return `^${major}.${minor}.0`;
}

// Map from VERSIONS key → workspace package directory name
const PACKAGE_MAP = {
  swCore:         'core',
  swNextjs:       'nextjs',
  swIcons:        'icons',
  swBuildScripts: 'build-scripts',
  swUiShadcn:     'ui-shadcn',
  swOtters:       'otters',
};

// Resolve current versions
const updates = {};
for (const [key, dir] of Object.entries(PACKAGE_MAP)) {
  const version = readVersion(dir);
  if (!version) {
    console.warn(`  ⚠️  Could not read version for ${dir} — skipping`);
    continue;
  }
  updates[key] = { version, range: toRange(version) };
}

// Read template-processor.ts
const TARGET = path.join(root, 'packages', 'cli', 'src', 'utils', 'template-processor.ts');
let src = fs.readFileSync(TARGET, 'utf8');

// Apply each update with a targeted regex per key
let changed = false;
for (const [key, { range, version }] of Object.entries(updates)) {
  // Matches: swCore: '^0.7.0',  or  swCore: "^0.7.0",
  const pattern = new RegExp(`(${key}:\\s*)['"]([^'"]+)['"]`);
  const newSrc = src.replace(pattern, `$1'${range}'`);
  if (newSrc !== src) {
    const oldMatch = src.match(pattern);
    const oldRange = oldMatch ? oldMatch[2] : '(unknown)';
    console.log(`  ${key}: '${oldRange}' → '${range}'  (from ${version})`);
    src = newSrc;
    changed = true;
  } else {
    console.log(`  ${key}: already '${range}' ✓`);
  }
}

if (changed) {
  fs.writeFileSync(TARGET, src, 'utf8');
  console.log('\n✅ template-processor.ts updated.');
} else {
  console.log('\n✅ All versions already in sync — no changes needed.');
}
