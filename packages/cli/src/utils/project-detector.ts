import fs from 'fs-extra';
import path from 'path';

export interface ProjectPaths {
  root: string;
  siteConfig: string;
  pagesDir: string;
}

/**
 * Detect the pages directory within a project root.
 * Checks both 'pages' and 'content/pages' — prefers 'pages' if both exist.
 * Falls back to 'pages' (the scaffold default) if neither exists yet.
 */
function detectPagesDir(root: string): string {
  const pagesDir = path.join(root, 'pages');
  const contentPagesDir = path.join(root, 'content', 'pages');

  // Prefer pages/ (scaffold default, existing convention)
  if (fs.existsSync(pagesDir)) return pagesDir;
  // Fall back to content/pages/ if it exists
  if (fs.existsSync(contentPagesDir)) return contentPagesDir;
  // Default to pages/ for new projects
  return pagesDir;
}

/**
 * Walks up from cwd to find a stackwright.yml / stackwright.yaml config file.
 * Throws with code 'NOT_A_PROJECT' if none is found.
 */
export function detectProject(cwd = process.cwd()): ProjectPaths {
  let dir = cwd;
  while (true) {
    const yml = path.join(dir, 'stackwright.yml');
    const yaml = path.join(dir, 'stackwright.yaml');
    if (fs.existsSync(yml)) return buildPaths(dir, yml);
    if (fs.existsSync(yaml)) return buildPaths(dir, yaml);
    const parent = path.dirname(dir);
    if (parent === dir) {
      const err = new Error(
        'No stackwright.yml found. Run this command from inside a Stackwright project.'
      );
      (err as NodeJS.ErrnoException).code = 'NOT_A_PROJECT';
      throw err;
    }
    dir = parent;
  }
}

function buildPaths(root: string, siteConfig: string): ProjectPaths {
  return {
    root,
    siteConfig,
    pagesDir: detectPagesDir(root),
  };
}

/**
 * Resolve the pages directory for a known project root.
 * Checks both 'pages' and 'content/pages' conventions.
 */
export function resolvePagesDir(projectRoot: string): string {
  return detectPagesDir(projectRoot);
}
