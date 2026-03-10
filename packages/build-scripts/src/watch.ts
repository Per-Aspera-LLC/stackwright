/**
 * stackwright-prebuild --watch
 *
 * File watcher that re-runs the prebuild pipeline when YAML content files
 * or co-located images change. Designed to run alongside `next dev` so that
 * content authored by AI agents (via MCP write_page) or humans appears in the
 * browser without restarting the dev server.
 *
 * Uses Node.js built-in `fs.watch` with `recursive: true` (supported on
 * Node 20+, which is the minimum engine requirement for this package).
 */

import fs from 'fs';
import path from 'path';
import { runPrebuild } from './prebuild';

const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp', '.ico']);
const YAML_EXTENSIONS = new Set(['.yml', '.yaml']);
const DEBOUNCE_MS = 150;

function isWatchedFile(filename: string): boolean {
  const ext = path.extname(filename).toLowerCase();
  return YAML_EXTENSIONS.has(ext) || IMAGE_EXTENSIONS.has(ext);
}

export function runWatch(projectRoot = process.cwd()): void {
  const pagesDir = path.join(projectRoot, 'pages');
  const siteConfigCandidates = ['stackwright.yml', 'stackwright.yaml'];
  const siteConfigFile = siteConfigCandidates
    .map(name => path.join(projectRoot, name))
    .find(p => fs.existsSync(p));

  // Initial full build
  try {
    runPrebuild(projectRoot);
  } catch (err) {
    console.error(`❌ ${(err as Error).message}`);
    console.log('👀 Watching for content changes (will retry on next change)...\n');
  }

  let debounceTimer: ReturnType<typeof setTimeout> | null = null;
  const watchers: fs.FSWatcher[] = [];

  function scheduleRebuild(reason: string) {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      try {
        runPrebuild(projectRoot);
        console.log(`👀 Rebuilt (${reason})\n`);
      } catch (err) {
        console.error(`❌ ${(err as Error).message}`);
        console.log('👀 Watching for content changes (will retry on next change)...\n');
      }
    }, DEBOUNCE_MS);
  }

  // Watch pages/ directory recursively for YAML and image changes
  if (fs.existsSync(pagesDir)) {
    const pagesWatcher = fs.watch(pagesDir, { recursive: true }, (_event, filename) => {
      if (!filename || !isWatchedFile(filename)) return;
      scheduleRebuild(filename);
    });
    watchers.push(pagesWatcher);
  }

  // Watch site config file by watching its parent directory
  if (siteConfigFile) {
    const configBasename = path.basename(siteConfigFile);
    const configWatcher = fs.watch(projectRoot, (_event, filename) => {
      if (filename === configBasename) {
        scheduleRebuild('site config');
      }
    });
    watchers.push(configWatcher);
  }

  console.log('👀 Watching for content changes...\n');

  // Clean shutdown
  function cleanup() {
    if (debounceTimer) clearTimeout(debounceTimer);
    for (const w of watchers) w.close();
    console.log('\n👋 Watcher stopped.');
    process.exit(0);
  }

  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);
}
