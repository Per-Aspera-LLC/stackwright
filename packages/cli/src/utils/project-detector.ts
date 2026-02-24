import fs from 'fs-extra';
import path from 'path';

export interface ProjectPaths {
  root: string;
  siteConfig: string;
  pagesDir: string;
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
    pagesDir: path.join(root, 'pages'),
  };
}
