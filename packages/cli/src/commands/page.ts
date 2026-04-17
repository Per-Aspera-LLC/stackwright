import { Command } from 'commander';
import { input } from '@inquirer/prompts';
import path from 'path';
import fs from 'fs-extra';
import chalk from 'chalk';
import yaml from 'js-yaml';
import { detectProject } from '../utils/project-detector';
import { validatePageContent } from '@stackwright/types';
import { outputResult, outputError, getErrorCode, formatError } from '../utils/json-output';

// ---------------------------------------------------------------------------
// Pure functions
// ---------------------------------------------------------------------------

export interface PageSummary {
  slug: string;
  heading: string | null;
  path: string;
}

export interface PageListResult {
  pages: PageSummary[];
}

export function listPages(pagesDir: string): PageListResult {
  if (!fs.existsSync(pagesDir)) {
    return { pages: [] };
  }

  const pages: PageSummary[] = [];
  collectPages(pagesDir, pagesDir, pages);
  return { pages };
}

function collectPages(pagesDir: string, currentDir: string, results: PageSummary[]): void {
  for (const entry of fs.readdirSync(currentDir)) {
    const fullPath = path.join(currentDir, entry);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      collectPages(pagesDir, fullPath, results);
    } else if (entry === 'content.yml' || entry === 'content.yaml') {
      const relDir = path.relative(pagesDir, currentDir);
      const slug = relDir === '' ? '/' : `/${relDir.replace(/\\/g, '/')}`;

      let heading: string | null = null;
      try {
        const raw = yaml.load(fs.readFileSync(fullPath, 'utf8')) as Record<string, unknown>;
        const items = (raw?.content as Record<string, unknown>)?.content_items;
        if (Array.isArray(items) && items.length > 0) {
          const first = items[0] as Record<string, unknown>;
          // Flat content item: { type: 'main', heading: { text: '...' }, ... }
          if (first?.type === 'main') {
            const headingBlock = first?.heading as Record<string, unknown> | undefined;
            heading = (headingBlock?.text as string | undefined) ?? null;
          }
        }
      } catch {
        // If parsing fails, heading stays null
      }

      results.push({ slug, heading, path: fullPath });
    }
  }
}

export interface ValidationError {
  slug: string;
  message: string;
}

export interface PageValidateResult {
  valid: boolean;
  errors: ValidationError[];
}

export function validatePages(pagesDir: string, slug?: string): PageValidateResult {
  const { pages } = listPages(pagesDir);
  const targets = slug ? pages.filter((p) => p.slug === `/${slug}` || p.slug === slug) : pages;

  const errors: ValidationError[] = [];

  for (const page of targets) {
    let raw: unknown;
    try {
      raw = yaml.load(fs.readFileSync(page.path, 'utf8'));
    } catch (err) {
      errors.push({ slug: page.slug, message: `YAML parse error: ${formatError(err)}` });
      continue;
    }

    const result = validatePageContent(raw);
    if (!result.valid) {
      for (const err of result.errors) {
        errors.push({ slug: page.slug, message: `${err.fieldPath}: ${err.hint}` });
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

export interface ReadPageResult {
  slug: string;
  content: string;
  path: string;
}

export function readPage(pagesDir: string, slug: string): ReadPageResult {
  const normalizedSlug = slug.startsWith('/') ? slug : `/${slug}`;
  const { pages } = listPages(pagesDir);
  const page = pages.find((p) => p.slug === normalizedSlug);

  if (!page) {
    const err = new Error(`Page not found: "${normalizedSlug}"`);
    (err as NodeJS.ErrnoException).code = 'PAGE_NOT_FOUND';
    throw err;
  }

  const content = fs.readFileSync(page.path, 'utf8');
  return { slug: page.slug, content, path: page.path };
}

export interface WritePageResult {
  slug: string;
  path: string;
  created: boolean;
}

export function writePage(pagesDir: string, slug: string, yamlContent: string): WritePageResult {
  const cleanSlug = slug.replace(/^\//, '').replace(/\\/g, '/');

  // Prevent path traversal
  const resolvedTarget = path.resolve(pagesDir, cleanSlug);
  if (
    !resolvedTarget.startsWith(path.resolve(pagesDir) + path.sep) &&
    resolvedTarget !== path.resolve(pagesDir)
  ) {
    const err = new Error(`Invalid slug: "${slug}"`);
    (err as NodeJS.ErrnoException).code = 'INVALID_SLUG';
    throw err;
  }

  // Parse and validate YAML before writing
  let raw: unknown;
  try {
    raw = yaml.load(yamlContent);
  } catch (parseErr) {
    const err = new Error(`YAML parse error: ${formatError(parseErr)}`);
    (err as NodeJS.ErrnoException).code = 'YAML_PARSE_ERROR';
    throw err;
  }

  // Validate using shared validator
  const result = validatePageContent(raw);
  if (!result.valid) {
    const fieldErrors = result.errors.map((e) => {
      const suggestion = e.suggestion ? ` (did you mean "${e.suggestion}"?)` : '';
      return `${e.fieldPath}: ${e.hint}${suggestion}`;
    });
    const err = new Error(`Validation failed:\n  ${fieldErrors.join('\n  ')}`);
    (err as NodeJS.ErrnoException).code = 'VALIDATION_FAILED';
    throw err;
  }

  const contentPath = path.join(pagesDir, cleanSlug, 'content.yml');
  const created = !fs.existsSync(contentPath);

  fs.ensureDirSync(path.dirname(contentPath));
  fs.writeFileSync(contentPath, yamlContent, 'utf8');

  return { slug: `/${cleanSlug}`, path: contentPath, created };
}

export interface AddPageResult {
  path: string;
  slug: string;
}

export async function addPage(
  pagesDir: string,
  slug: string,
  opts: { heading?: string }
): Promise<AddPageResult> {
  const cleanSlug = slug.replace(/^\//, '').replace(/\\/g, '/');

  // Prevent path traversal: slug must not escape the pages directory
  const resolvedTarget = path.resolve(pagesDir, cleanSlug);
  if (!resolvedTarget.startsWith(path.resolve(pagesDir) + path.sep)) {
    const err = new Error(`Invalid slug: "${slug}"`);
    (err as NodeJS.ErrnoException).code = 'INVALID_SLUG';
    throw err;
  }

  const contentPath = path.join(pagesDir, cleanSlug, 'content.yml');

  if (fs.existsSync(contentPath)) {
    const err = new Error(`Page already exists: ${contentPath}`);
    (err as NodeJS.ErrnoException).code = 'PAGE_EXISTS';
    throw err;
  }

  const heading = opts.heading ?? cleanSlug;
  const content = `content:
  content_items:
    - type: main
      label: "${cleanSlug}-hero"
      heading:
        text: "${heading}"
        textSize: "h1"
      textBlocks:
        - text: "Edit pages/${cleanSlug}/content.yml to update this page."
          textSize: "body1"
`;

  await fs.ensureDir(path.dirname(contentPath));
  await fs.writeFile(contentPath, content, 'utf8');

  return { path: contentPath, slug: `/${cleanSlug}` };
}

// ---------------------------------------------------------------------------
// Commander registration
// ---------------------------------------------------------------------------

export function registerPage(program: Command): void {
  const page = program.command('page').description('Manage pages');

  page
    .command('add <slug>')
    .description('Create a new page with boilerplate content')
    .option('--heading <heading>', 'Page heading text')
    .option(
      '--content <yaml>',
      'YAML content for the page (skips boilerplate, validates before writing)'
    )
    .option('--json', 'Output machine-readable JSON')
    .action(async (slug: string, opts: { heading?: string; content?: string; json?: boolean }) => {
      const json = Boolean(opts.json);
      try {
        const { pagesDir } = detectProject();
        if (opts.content !== undefined) {
          // --content path: validate and write directly, skip heading prompt entirely
          const result = writePage(pagesDir, slug, opts.content);
          if (!result.created) {
            outputError(
              `Page already exists: ${result.path}\n  Hint: Use "stackwright page write <slug>" to update an existing page.`,
              'PAGE_EXISTS',
              { json }
            );
            return;
          }
          outputResult(result, { json }, () => {
            console.log(chalk.green(`Created ${result.path}`));
          });
        } else {
          // Existing boilerplate path: completely unchanged
          const heading =
            opts.heading ??
            (!json ? await input({ message: 'Page heading:', default: slug }) : slug);
          const result = await addPage(pagesDir, slug, { heading });
          outputResult(result, { json }, () => {
            console.log(chalk.green(`Created ${result.path}`));
          });
        }
      } catch (err: unknown) {
        const code = getErrorCode(err);
        if (code === 'NOT_A_PROJECT') {
          outputError(
            formatError(err) + '\n  Hint: Use "stackwright scaffold" to create a new project.',
            'NOT_A_PROJECT',
            { json }
          );
        } else if (code === 'INVALID_SLUG' || code === 'PAGE_EXISTS') {
          const hint =
            code === 'PAGE_EXISTS'
              ? '\n  Hint: Use "stackwright page write <slug>" to update an existing page.'
              : '';
          outputError(formatError(err) + hint, code, { json });
        } else if (code === 'VALIDATION_FAILED' || code === 'YAML_PARSE_ERROR') {
          outputError(formatError(err), code, { json });
        } else {
          outputError(formatError(err), 'ADD_PAGE_FAILED', { json }, 2);
        }
      }
    });

  page
    .command('get <slug>')
    .description("Read a page's raw YAML content by slug")
    .option('--json', 'Output machine-readable JSON')
    .action((slug: string, opts: { json?: boolean }) => {
      const json = Boolean(opts.json);
      try {
        const { pagesDir } = detectProject();
        const result = readPage(pagesDir, slug);
        outputResult(result, { json }, () => {
          console.log(result.content);
        });
      } catch (err: unknown) {
        const code = getErrorCode(err);
        if (code === 'NOT_A_PROJECT') {
          outputError(
            formatError(err) + '\n  Hint: Use "stackwright scaffold" to create a new project.',
            'NOT_A_PROJECT',
            { json }
          );
        } else if (code === 'PAGE_NOT_FOUND') {
          outputError(formatError(err), code, { json });
        } else {
          outputError(formatError(err), 'READ_PAGE_FAILED', { json }, 2);
        }
      }
    });

  page
    .command('write <slug>')
    .description('Write YAML content to a page (validates before writing)')
    .option('--json', 'Output machine-readable JSON')
    .option('--file <path>', 'Read YAML content from a file instead of stdin')
    .action(async (slug: string, opts: { json?: boolean; file?: string }) => {
      const json = Boolean(opts.json);
      try {
        const { pagesDir } = detectProject();
        let yamlContent: string;
        if (opts.file) {
          yamlContent = fs.readFileSync(opts.file, 'utf8');
        } else {
          // Read from stdin
          const chunks: Buffer[] = [];
          for await (const chunk of process.stdin) {
            chunks.push(chunk);
          }
          yamlContent = Buffer.concat(chunks).toString('utf8');
        }
        const result = writePage(pagesDir, slug, yamlContent);
        outputResult(result, { json }, () => {
          const verb = result.created ? 'Created' : 'Updated';
          console.log(chalk.green(`${verb} page "${result.slug}" at ${result.path}`));
        });
      } catch (err: unknown) {
        const code = getErrorCode(err);
        if (code === 'NOT_A_PROJECT') {
          outputError(
            formatError(err) + '\n  Hint: Use "stackwright scaffold" to create a new project.',
            'NOT_A_PROJECT',
            { json }
          );
        } else if (
          code === 'VALIDATION_FAILED' ||
          code === 'YAML_PARSE_ERROR' ||
          code === 'INVALID_SLUG'
        ) {
          outputError(formatError(err), code, { json });
        } else {
          outputError(formatError(err), 'WRITE_PAGE_FAILED', { json }, 2);
        }
      }
    });

  page
    .command('list')
    .description('List all pages in the project')
    .option('--json', 'Output machine-readable JSON')
    .action((opts: { json?: boolean }) => {
      const json = Boolean(opts.json);
      try {
        const { pagesDir } = detectProject();
        const result = listPages(pagesDir);
        outputResult(result, { json }, () => {
          if (result.pages.length === 0) {
            console.log('No pages found.');
            return;
          }
          for (const p of result.pages) {
            const label = p.heading ? chalk.bold(p.heading) : chalk.dim('(no heading)');
            console.log(`  ${chalk.cyan(p.slug.padEnd(30))} ${label}`);
          }
        });
      } catch (err: unknown) {
        if (getErrorCode(err) === 'NOT_A_PROJECT') {
          outputError(
            formatError(err) + '\n  Hint: Use "stackwright scaffold" to create a new project.',
            'NOT_A_PROJECT',
            { json }
          );
        } else {
          outputError(formatError(err), 'LIST_FAILED', { json }, 2);
        }
      }
    });

  page
    .command('validate [slug]')
    .description('Validate page YAML against the content schema')
    .option('--json', 'Output machine-readable JSON')
    .action((slug: string | undefined, opts: { json?: boolean }) => {
      const json = Boolean(opts.json);
      try {
        const { pagesDir } = detectProject();
        const result = validatePages(pagesDir, slug);
        outputResult(result, { json }, () => {
          if (result.valid) {
            console.log(chalk.green('All pages are valid.'));
          } else {
            console.log(chalk.red(`\n${result.errors.length} validation error(s):\n`));
            for (const e of result.errors) {
              console.log(chalk.red(`  ${e.slug}: ${e.message.split(':')[0]}`));
              const hint = e.message.split(':').slice(1).join(':').trim();
              if (hint) {
                console.log(`    ${hint}`);
              }
              // Check for suggestions in the original error
              const suggestionMatch = hint.match(/Did you mean "([^"]+)"/);
              if (suggestionMatch) {
                console.log(chalk.yellow(`    Did you mean: "${suggestionMatch[1]}"?`));
              }
            }
          }
        });
        if (!result.valid) process.exit(1);
      } catch (err: unknown) {
        if (getErrorCode(err) === 'NOT_A_PROJECT') {
          outputError(
            formatError(err) + '\n  Hint: Use "stackwright scaffold" to create a new project.',
            'NOT_A_PROJECT',
            { json }
          );
        } else {
          outputError(formatError(err), 'VALIDATE_FAILED', { json }, 2);
        }
      }
    });
}
