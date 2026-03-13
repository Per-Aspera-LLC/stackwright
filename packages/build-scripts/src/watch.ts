/**
 * stackwright-prebuild --watch
 *
 * File watcher that re-runs the prebuild pipeline when YAML content files
 * or co-located images change. Designed to run alongside `next dev` so that
 * content authored by AI agents (via MCP write_page) or humans appears in the
 * browser without restarting the dev server.
 *
 * Watches:
 *   pages/    - page content YAML and co-located images
 *   content/  - collection entry YAML and co-located images
 *
 * Uses Node.js built-in `fs.watch` with `recursive: true` (supported on
 * Node 20+, which is the minimum engine requirement for this package).
 *
 * Includes a lightweight SSE (Server-Sent Events) server that notifies the
 * browser to reload when content changes. The client-side listener lives in
 * `@stackwright/core`'s `useDevContentReload` hook (used by DynamicPage).
 */

import fs from 'fs';
import http from 'http';
import path from 'path';
import { runPrebuild } from './prebuild';

const IMAGE_EXTENSIONS = new Set([
  '.jpg',
  '.jpeg',
  '.png',
  '.gif',
  '.webp',
  '.svg',
  '.bmp',
  '.ico',
]);
const YAML_EXTENSIONS = new Set(['.yml', '.yaml']);
const DEBOUNCE_MS = 150;

/** Default port for the SSE reload server. Matches the client in @stackwright/core. */
export const DEFAULT_RELOAD_PORT = 35729;

function isWatchedFile(filename: string): boolean {
  const ext = path.extname(filename).toLowerCase();
  return YAML_EXTENSIONS.has(ext) || IMAGE_EXTENSIONS.has(ext);
}

// -- SSE reload server ------------------------------------------------------

let sseClients: http.ServerResponse[] = [];

function startReloadServer(port: number): http.Server {
  const server = http.createServer((req, res) => {
    if (req.url === '/__stackwright_sse') {
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
        'Access-Control-Allow-Origin': '*',
      });
      sseClients.push(res);
      req.on('close', () => {
        sseClients = sseClients.filter((c) => c !== res);
      });
    } else {
      res.writeHead(404);
      res.end();
    }
  });

  server.listen(port, () => {
    console.log(`Content reload server on port ${port}`);
  });

  server.on('error', (err: NodeJS.ErrnoException) => {
    if (err.code === 'EADDRINUSE') {
      console.warn(
        `WARNING: Port ${port} in use -- browser auto-reload disabled. Content will still rebuild; refresh manually.`
      );
    } else {
      console.warn(`WARNING: Reload server failed: ${err.message}`);
    }
  });

  return server;
}

function notifyContentChange() {
  for (const client of sseClients) {
    client.write(`event: content-change\ndata: ${Date.now()}\n\n`);
  }
}

// -- Main -------------------------------------------------------------------

export function runWatch(projectRoot = process.cwd()): void {
  const pagesDir = path.join(projectRoot, 'pages');
  const contentDir = path.join(projectRoot, 'content');
  const siteConfigCandidates = ['stackwright.yml', 'stackwright.yaml'];
  const siteConfigFile = siteConfigCandidates
    .map((name) => path.join(projectRoot, name))
    .find((p) => fs.existsSync(p));

  const reloadPort = parseInt(process.env.STACKWRIGHT_RELOAD_PORT || '', 10) || DEFAULT_RELOAD_PORT;

  // Initial full build
  try {
    runPrebuild(projectRoot);
  } catch (err) {
    console.error(`ERROR: ${(err as Error).message}`);
    console.log('Watching for content changes (will retry on next change)...\n');
  }

  // Start SSE server for browser auto-reload
  const reloadServer = startReloadServer(reloadPort);

  let debounceTimer: ReturnType<typeof setTimeout> | null = null;
  const watchers: fs.FSWatcher[] = [];

  function scheduleRebuild(reason: string) {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      try {
        runPrebuild(projectRoot);
        notifyContentChange();
        console.log(`Rebuilt (${reason})\n`);
      } catch (err) {
        console.error(`ERROR: ${(err as Error).message}`);
        console.log('Watching for content changes (will retry on next change)...\n');
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

  // Watch content/ directory recursively for collection changes
  if (fs.existsSync(contentDir)) {
    const contentWatcher = fs.watch(contentDir, { recursive: true }, (_event, filename) => {
      if (!filename || !isWatchedFile(filename)) return;
      scheduleRebuild(`collection: ${filename}`);
    });
    watchers.push(contentWatcher);
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

  console.log('Watching for content changes...\n');

  // Clean shutdown
  function cleanup() {
    if (debounceTimer) clearTimeout(debounceTimer);
    for (const w of watchers) w.close();
    reloadServer.close();
    sseClients = [];
    console.log('\nWatcher stopped.');
    process.exit(0);
  }

  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);
}
