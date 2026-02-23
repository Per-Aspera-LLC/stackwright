import { Command } from 'commander';
import { input } from '@inquirer/prompts';
import path from 'path';
import fs from 'fs-extra';
import chalk from 'chalk';
import yaml from 'js-yaml';
import Ajv from 'ajv';
import { detectProject } from '../utils/project-detector';
import { loadContentSchema } from '../utils/schema-loader';
import { outputResult, outputError } from '../utils/json-output';

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

function collectPages(
  pagesDir: string,
  currentDir: string,
  results: PageSummary[]
): void {
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
          const main = first?.main as Record<string, unknown> | undefined;
          const headingBlock = main?.heading as Record<string, unknown> | undefined;
          heading = (headingBlock?.text as string | undefined) ?? null;
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
  const schema = loadContentSchema();
  const ajv = new Ajv({ allErrors: true, strict: false });
  const validate = ajv.compile(schema);

  const { pages } = listPages(pagesDir);
  const targets = slug
    ? pages.filter((p) => p.slug === `/${slug}` || p.slug === slug)
    : pages;

  const errors: ValidationError[] = [];

  for (const page of targets) {
    try {
      const raw = yaml.load(fs.readFileSync(page.path, 'utf8'));
      const content = (raw as Record<string, unknown>)?.content;
      const valid = validate(raw);
      if (!valid && validate.errors) {
        for (const e of validate.errors) {
          errors.push({
            slug: page.slug,
            message: `${e.instancePath || '(root)'} ${e.message ?? 'invalid'}`,
          });
        }
      }
    } catch (err) {
      errors.push({ slug: page.slug, message: `Failed to parse YAML: ${String(err)}` });
    }
  }

  return { valid: errors.length === 0, errors };
}

export interface AddPageResult {
  path: string;
  slug: string;
}

export async function addPage(
  pagesDir: string,
  slug: string,
  opts: { heading?: string; json?: boolean }
): Promise<AddPageResult> {
  const cleanSlug = slug.replace(/^\//, '');
  const contentPath = path.join(pagesDir, cleanSlug, 'content.yml');

  if (fs.existsSync(contentPath)) {
    outputError(
      `Page already exists: ${contentPath}`,
      'PAGE_EXISTS',
      { json: Boolean(opts.json) }
    );
  }

  const heading = opts.heading ?? cleanSlug;
  const content = `content:
  content_items:
    - main:
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
    .option('--json', 'Output machine-readable JSON')
    .action(async (slug: string, opts: { heading?: string; json?: boolean }) => {
      const json = Boolean(opts.json);
      try {
        const { pagesDir } = detectProject();
        const heading = opts.heading ?? (
          !json
            ? await input({ message: 'Page heading:', default: slug })
            : slug
        );
        const result = await addPage(pagesDir, slug, { ...opts, heading });
        outputResult(result, { json }, () => {
          console.log(chalk.green(`Created ${result.path}`));
        });
      } catch (err: unknown) {
        const e = err as NodeJS.ErrnoException;
        if (e.code === 'NOT_A_PROJECT') {
          outputError(e.message, 'NOT_A_PROJECT', { json });
        }
        outputError(String(err), 'ADD_PAGE_FAILED', { json }, 2);
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
        const e = err as NodeJS.ErrnoException;
        if (e.code === 'NOT_A_PROJECT') {
          outputError(e.message, 'NOT_A_PROJECT', { json });
        }
        outputError(String(err), 'LIST_FAILED', { json }, 2);
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
            for (const e of result.errors) {
              console.log(chalk.red(`  ${e.slug}: ${e.message}`));
            }
          }
        });
        if (!result.valid) process.exit(1);
      } catch (err: unknown) {
        const e = err as NodeJS.ErrnoException;
        if (e.code === 'NOT_A_PROJECT') {
          outputError(e.message, 'NOT_A_PROJECT', { json });
        }
        outputError(String(err), 'VALIDATE_FAILED', { json }, 2);
      }
    });
}
