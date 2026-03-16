/**
 * Atomic whole-site composition — validates and writes an entire site in one operation.
 *
 * The compose workflow:
 * 1. Validate the entire site holistically (schema + cross-page semantic checks)
 * 2. If any errors: reject the entire payload, write nothing
 * 3. If valid: write site config + all pages atomically
 */

import { Command } from 'commander';
import path from 'path';
import fs from 'fs-extra';
import chalk from 'chalk';
import {
  validateSiteComposition,
  type ComposeIssue,
  type ValidateSiteCompositionResult,
} from '../utils/site-validator';
import { detectProject } from '../utils/project-detector';
import { outputResult, outputError, getErrorCode, formatError } from '../utils/json-output';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ComposeSiteOptions {
  /** Known collection names for cross-validation */
  existingCollections?: string[];
}

export interface ComposeSiteResult {
  siteConfigPath: string;
  pagesCreated: string[];
  pagesUpdated: string[];
  warnings: ComposeIssue[];
  validation: ValidateSiteCompositionResult;
}

// ---------------------------------------------------------------------------
// Pure function
// ---------------------------------------------------------------------------

/**
 * Validate and write an entire site atomically.
 *
 * If validation produces any errors, nothing is written and the function
 * throws with code `COMPOSITION_INVALID`. If validation passes (possibly
 * with warnings), all files are written.
 *
 * @param projectRoot - Absolute path to the Stackwright project root
 * @param siteConfigYaml - Full YAML content for stackwright.yml
 * @param pages - Map of slug → YAML content for each page
 * @param options - Optional settings (e.g. known collections)
 */
export function composeSite(
  projectRoot: string,
  siteConfigYaml: string,
  pages: Record<string, string>,
  options?: ComposeSiteOptions
): ComposeSiteResult {
  // Input validation
  if (!projectRoot || !path.isAbsolute(projectRoot)) {
    const err = new Error('projectRoot must be an absolute path');
    (err as NodeJS.ErrnoException).code = 'INVALID_PROJECT_ROOT';
    throw err;
  }

  if (!siteConfigYaml || typeof siteConfigYaml !== 'string') {
    const err = new Error('siteConfigYaml is required');
    (err as NodeJS.ErrnoException).code = 'MISSING_SITE_CONFIG';
    throw err;
  }

  if (!pages || typeof pages !== 'object' || Object.keys(pages).length === 0) {
    const err = new Error('At least one page is required');
    (err as NodeJS.ErrnoException).code = 'MISSING_PAGES';
    throw err;
  }

  // Size guard — prevent absurdly large payloads
  const MAX_PAYLOAD_SIZE = 10_000_000; // 10MB total
  const totalSize =
    siteConfigYaml.length + Object.values(pages).reduce((sum, p) => sum + p.length, 0);
  if (totalSize > MAX_PAYLOAD_SIZE) {
    const err = new Error(
      `Total payload size ${totalSize} exceeds maximum ${MAX_PAYLOAD_SIZE} bytes`
    );
    (err as NodeJS.ErrnoException).code = 'PAYLOAD_TOO_LARGE';
    throw err;
  }

  // 1. Holistic validation
  const validation = validateSiteComposition(siteConfigYaml, pages, {
    existingCollections: options?.existingCollections,
  });

  if (!validation.valid) {
    const errorLines = validation.errors.map(
      (e) => `  [${e.source}] (${e.category}) ${e.message}`
    );
    const err = new Error(
      `Site composition validation failed (${validation.errors.length} error(s)):\n${errorLines.join('\n')}`
    );
    (err as NodeJS.ErrnoException).code = 'COMPOSITION_INVALID';
    // Attach full validation result for programmatic access
    (err as any).validation = validation;
    throw err;
  }

  // 2. Atomic write — write to temp dir first, then move into place
  const pagesDir = path.join(projectRoot, 'pages');
  const siteConfigPath = path.join(projectRoot, 'stackwright.yml');

  // Track what we're creating vs updating
  const pagesCreated: string[] = [];
  const pagesUpdated: string[] = [];

  // Ensure project directory exists
  fs.ensureDirSync(projectRoot);

  // Write site config
  fs.writeFileSync(siteConfigPath, siteConfigYaml, 'utf8');

  // Write pages
  for (const [slug, yamlContent] of Object.entries(pages)) {
    const cleanSlug = slug.replace(/^\//, '').replace(/\\/g, '/');

    // Determine the content file path
    let contentPath: string;
    if (cleanSlug === '' || cleanSlug === '/') {
      // Root page
      contentPath = path.join(pagesDir, 'content.yml');
    } else {
      contentPath = path.join(pagesDir, cleanSlug, 'content.yml');
    }

    // Security: prevent path traversal
    const resolvedPath = path.resolve(contentPath);
    const resolvedPagesDir = path.resolve(pagesDir);
    if (
      !resolvedPath.startsWith(resolvedPagesDir + path.sep) &&
      resolvedPath !== path.join(resolvedPagesDir, 'content.yml')
    ) {
      const err = new Error(`Invalid slug: "${slug}" — resolved path escapes pages directory`);
      (err as NodeJS.ErrnoException).code = 'INVALID_SLUG';
      throw err;
    }

    const isNew = !fs.existsSync(contentPath);

    fs.ensureDirSync(path.dirname(contentPath));
    fs.writeFileSync(contentPath, yamlContent, 'utf8');

    const displaySlug = cleanSlug === '' ? '/' : `/${cleanSlug}`;
    if (isNew) {
      pagesCreated.push(displaySlug);
    } else {
      pagesUpdated.push(displaySlug);
    }
  }

  return {
    siteConfigPath,
    pagesCreated,
    pagesUpdated,
    warnings: validation.warnings,
    validation,
  };
}

// ---------------------------------------------------------------------------
// Commander registration
// ---------------------------------------------------------------------------

export function registerCompose(program: Command): void {
  program
    .command('compose')
    .description(
      'Validate and write an entire site atomically (site config + all pages in one operation)'
    )
    .requiredOption('--config <path>', 'Path to the site config YAML file')
    .requiredOption('--pages-dir <path>', 'Path to directory containing page YAML files')
    .option('--project-root <path>', 'Project root directory (default: cwd)')
    .option('--json', 'Output machine-readable JSON')
    .action(
      async (opts: {
        config: string;
        pagesDir: string;
        projectRoot?: string;
        json?: boolean;
      }) => {
        const json = Boolean(opts.json);
        const projectRoot = opts.projectRoot
          ? path.resolve(opts.projectRoot)
          : process.cwd();

        try {
          // Read site config
          const siteConfigYaml = fs.readFileSync(path.resolve(opts.config), 'utf8');

          // Read all page YAML files from the pages directory
          const pagesDirPath = path.resolve(opts.pagesDir);
          const pages: Record<string, string> = {};
          collectPageYaml(pagesDirPath, pagesDirPath, pages);

          if (Object.keys(pages).length === 0) {
            outputError('No page YAML files found in ' + pagesDirPath, 'MISSING_PAGES', { json });
            return;
          }

          const result = composeSite(projectRoot, siteConfigYaml, pages);

          outputResult(result, { json }, () => {
            console.log(chalk.green('\n✓ Site composed successfully'));
            console.log(`  Site config: ${result.siteConfigPath}`);
            if (result.pagesCreated.length > 0) {
              console.log(`  Pages created: ${result.pagesCreated.join(', ')}`);
            }
            if (result.pagesUpdated.length > 0) {
              console.log(`  Pages updated: ${result.pagesUpdated.join(', ')}`);
            }
            if (result.warnings.length > 0) {
              console.log(chalk.yellow(`\n  ${result.warnings.length} warning(s):`));
              for (const w of result.warnings) {
                console.log(chalk.yellow(`    [${w.source}] ${w.message}`));
              }
            }
          });
        } catch (err: unknown) {
          const code = getErrorCode(err);
          if (code === 'COMPOSITION_INVALID') {
            outputError(formatError(err), code, { json });
          } else {
            outputError(formatError(err), code || 'COMPOSE_FAILED', { json }, 2);
          }
        }
      }
    );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Recursively collect content.yml files, building a slug → YAML map. */
function collectPageYaml(
  baseDir: string,
  currentDir: string,
  result: Record<string, string>
): void {
  if (!fs.existsSync(currentDir)) return;

  for (const entry of fs.readdirSync(currentDir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      collectPageYaml(baseDir, path.join(currentDir, entry.name), result);
    } else if (entry.name === 'content.yml' || entry.name === 'content.yaml') {
      const relDir = path.relative(baseDir, currentDir);
      const slug = relDir === '' ? '/' : relDir.replace(/\\/g, '/');
      result[slug] = fs.readFileSync(path.join(currentDir, entry.name), 'utf8');
    }
  }
}
