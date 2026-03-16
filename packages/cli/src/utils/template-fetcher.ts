/**
 * Template fetcher — downloads project boilerplate from a GitHub template repo,
 * falling back to the bundled templates directory when offline or on error.
 *
 * This module is the bridge toward moving static template files out of the CLI
 * npm package and into a standalone GitHub template repository.
 */

import https from 'https';
import fs from 'fs-extra';
import path from 'path';
import { execFileSync } from 'child_process';

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const TEMPLATE_REPO = 'Per-Aspera-LLC/stackwright-template-nextjs';
const DEFAULT_REF = 'main';
const FETCH_TIMEOUT_MS = 10_000;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface FetchTemplateOptions {
  /** Git ref (tag, branch, commit) to fetch. Defaults to 'main'. */
  ref?: string;
  /** Skip network fetch and use bundled templates only. */
  offline?: boolean;
}

// ---------------------------------------------------------------------------
// GitHub tarball fetcher
// ---------------------------------------------------------------------------

function fetchTarball(repo: string, ref: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const url = `https://api.github.com/repos/${repo}/tarball/${ref}`;

    const request = https.get(
      url,
      {
        headers: {
          'User-Agent': 'stackwright-cli',
          Accept: 'application/vnd.github+json',
        },
        timeout: FETCH_TIMEOUT_MS,
      },
      (res) => {
        // Follow redirects (GitHub returns 302 to a CDN URL)
        if (
          res.statusCode &&
          res.statusCode >= 300 &&
          res.statusCode < 400 &&
          res.headers.location
        ) {
          https
            .get(res.headers.location, { timeout: FETCH_TIMEOUT_MS }, (redirectRes) => {
              const chunks: Buffer[] = [];
              redirectRes.on('data', (chunk: Buffer) => chunks.push(chunk));
              redirectRes.on('end', () => resolve(Buffer.concat(chunks)));
              redirectRes.on('error', reject);
            })
            .on('error', reject)
            .on('timeout', function (this: ReturnType<typeof https.get>) {
              this.destroy();
              reject(new Error('Template download timed out'));
            });
          return;
        }

        if (res.statusCode !== 200) {
          reject(new Error(`GitHub API returned ${res.statusCode}`));
          return;
        }

        const chunks: Buffer[] = [];
        res.on('data', (chunk: Buffer) => chunks.push(chunk));
        res.on('end', () => resolve(Buffer.concat(chunks)));
        res.on('error', reject);
      }
    );

    request.on('error', reject);
    request.on('timeout', () => {
      request.destroy();
      reject(new Error('Template download timed out'));
    });
  });
}

async function extractTarball(tarballBuffer: Buffer, targetDir: string): Promise<void> {
  const tmpFile = path.join(targetDir, '.template.tar.gz');

  try {
    await fs.writeFile(tmpFile, tarballBuffer);
    // Use system tar (available on Linux, macOS, and modern Windows)
    // --strip-components=1 removes the top-level directory GitHub adds
    // execFileSync avoids shell interpretation, preventing command injection
    // via targetDir or tmpFile (CodeQL: js/shell-command-constructed-from-input)
    execFileSync('tar', ['-xzf', tmpFile, '--strip-components=1'], {
      cwd: targetDir,
      stdio: 'ignore',
    });
  } finally {
    await fs.remove(tmpFile);
  }
}

// ---------------------------------------------------------------------------
// Bundled fallback
// ---------------------------------------------------------------------------

function getBundledTemplatePath(): string {
  // tsup outputs to dist/, templates are at templates/ (sibling)
  return path.join(__dirname, '..', 'templates', 'scaffold-template');
}

async function copyBundledTemplate(targetDir: string): Promise<void> {
  const templateDir = getBundledTemplatePath();

  if (!fs.existsSync(templateDir)) {
    throw new Error(
      `Bundled template not found at ${templateDir}\n` +
        'This is a packaging error — please reinstall @stackwright/cli.'
    );
  }

  await fs.copy(templateDir, targetDir, { overwrite: true });
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Fetches template files into the target directory.
 *
 * Tries GitHub tarball first, falls back to bundled templates on any error.
 * Use `offline: true` to skip the network attempt entirely.
 */
export async function fetchTemplate(
  targetDir: string,
  options: FetchTemplateOptions = {}
): Promise<{ source: 'github' | 'bundled' }> {
  const { ref = DEFAULT_REF, offline = false } = options;

  if (!offline) {
    try {
      const tarball = await fetchTarball(TEMPLATE_REPO, ref);
      await fs.ensureDir(targetDir);
      await extractTarball(tarball, targetDir);
      return { source: 'github' };
    } catch {
      // Fall through to bundled fallback
    }
  }

  await fs.ensureDir(targetDir);
  await copyBundledTemplate(targetDir);
  return { source: 'bundled' };
}
