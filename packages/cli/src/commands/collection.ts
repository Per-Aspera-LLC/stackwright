import { Command } from 'commander';
import path from 'path';
import fs from 'fs-extra';
import chalk from 'chalk';
import yaml from 'js-yaml';
import { detectProject } from '../utils/project-detector';
import { outputResult, outputError, formatError } from '../utils/json-output';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CollectionSummary {
  name: string;
  entryCount: number;
  hasEntryPage: boolean;
  basePath?: string;
}

export interface CollectionListResult {
  collections: CollectionSummary[];
}

export interface AddCollectionResult {
  name: string;
  path: string;
  configPath: string;
  sampleEntryPath: string;
  entryPage: boolean;
}

// ---------------------------------------------------------------------------
// Pure functions (exported for programmatic use and MCP)
// ---------------------------------------------------------------------------

/** Resolve the content directory for a project root. */
export function resolveContentDir(projectRoot: string): string {
  return path.join(projectRoot, 'content');
}

/** List all collections in a project. */
export function listCollections(contentDir: string): CollectionListResult {
  if (!fs.existsSync(contentDir)) {
    return { collections: [] };
  }

  const collections: CollectionSummary[] = [];

  for (const entry of fs.readdirSync(contentDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;

    const collDir = path.join(contentDir, entry.name);
    const yamlFiles = fs
      .readdirSync(collDir)
      .filter(
        (f) =>
          (f.endsWith('.yml') || f.endsWith('.yaml')) &&
          f !== '_collection.yml' &&
          f !== '_collection.yaml'
      );

    // Read config to check for entryPage
    let hasEntryPage = false;
    let basePath: string | undefined;
    const configCandidates = ['_collection.yml', '_collection.yaml'];
    for (const cfgName of configCandidates) {
      const cfgPath = path.join(collDir, cfgName);
      if (fs.existsSync(cfgPath)) {
        try {
          const cfg = yaml.load(fs.readFileSync(cfgPath, 'utf8')) as Record<string, any>;
          if (cfg?.entryPage) {
            hasEntryPage = true;
            basePath = cfg.entryPage.basePath;
          }
        } catch {
          // ignore parse errors
        }
        break;
      }
    }

    collections.push({
      name: entry.name,
      entryCount: yamlFiles.length,
      hasEntryPage,
      basePath,
    });
  }

  return { collections };
}

/** Create a new collection with optional entryPage config. */
export function addCollection(
  contentDir: string,
  name: string,
  options: {
    entryPage?: boolean;
    basePath?: string;
    sort?: string;
    bodyField?: string;
  } = {}
): AddCollectionResult {
  // Validate collection name to prevent path traversal
  if (!/^[a-zA-Z0-9][a-zA-Z0-9_-]*$/.test(name)) {
    const err = new Error(
      `Invalid collection name "${name}". Use only alphanumeric characters, hyphens, and underscores.`
    );
    (err as NodeJS.ErrnoException).code = 'INVALID_NAME';
    throw err;
  }

  const collDir = path.join(contentDir, name);

  if (fs.existsSync(collDir)) {
    const err = new Error(`Collection "${name}" already exists at ${collDir}`);
    (err as NodeJS.ErrnoException).code = 'COLLECTION_EXISTS';
    throw err;
  }

  fs.mkdirSync(collDir, { recursive: true });

  // Build collection config
  const config: Record<string, unknown> = {};
  if (options.sort) {
    config.sort = options.sort;
  }
  config.indexFields = ['title', 'date', 'excerpt', 'tags'];

  if (options.entryPage) {
    const basePath = options.basePath || `/${name}/`;
    config.entryPage = {
      basePath,
      body: options.bodyField || 'body',
      meta: ['date', 'author'],
      tags: 'tags',
    };
  }

  const configPath = path.join(collDir, '_collection.yaml');
  fs.writeFileSync(configPath, yaml.dump(config, { lineWidth: 120 }), 'utf8');

  // Write a sample entry
  const sampleEntry = {
    title: `Sample ${name.charAt(0).toUpperCase() + name.slice(1)} Entry`,
    date: new Date().toISOString().split('T')[0],
    author: 'Your Name',
    excerpt: `This is a sample entry in the ${name} collection.`,
    tags: ['sample'],
    body: `Welcome to your new ${name} collection!\n\nThis is a sample entry. Edit or replace this file with your own content.\nEach YAML file in this directory becomes an entry in the collection.`,
  };

  const sampleEntryPath = path.join(collDir, 'sample-entry.yaml');
  fs.writeFileSync(sampleEntryPath, yaml.dump(sampleEntry, { lineWidth: 120 }), 'utf8');

  return {
    name,
    path: collDir,
    configPath,
    sampleEntryPath,
    entryPage: !!options.entryPage,
  };
}

// ---------------------------------------------------------------------------
// Commander registration
// ---------------------------------------------------------------------------

export function registerCollection(program: Command): void {
  const cmd = program
    .command('collection')
    .description('Manage Stackwright collections');

  cmd
    .command('list')
    .description('List all collections in the project')
    .option('--json', 'Output machine-readable JSON')
    .action((opts: { json?: boolean }) => {
      const json = Boolean(opts.json);

      try {
        const { root } = detectProject();
        const result = listCollections(resolveContentDir(root));

        outputResult(result, { json }, () => {
          if (result.collections.length === 0) {
            console.log(chalk.yellow('No collections found. Create one with: stackwright collection add <name>'));
            return;
          }

          console.log(chalk.bold(`\nCollections (${result.collections.length}):\n`));
          for (const coll of result.collections) {
            const entryPageIndicator = coll.hasEntryPage
              ? chalk.green(` → entry pages at ${coll.basePath}`)
              : '';
            console.log(`  ${chalk.cyan(coll.name)}  (${coll.entryCount} entries)${entryPageIndicator}`);
          }
          console.log();
        });
      } catch (err) {
        outputError(formatError(err), 'LIST_FAILED', { json });
      }
    });

  cmd
    .command('add <name>')
    .description('Create a new collection with config and sample entry')
    .option('--entry-page', 'Include entryPage config for automatic page generation')
    .option('--base-path <path>', 'URL base path for entry pages (default: /<name>/)')
    .option('--sort <field>', 'Default sort field (prefix with - for descending, e.g. -date)')
    .option('--body-field <field>', 'Field name for entry body content (default: body)')
    .option('--json', 'Output machine-readable JSON')
    .action(
      (
        name: string,
        opts: {
          entryPage?: boolean;
          basePath?: string;
          sort?: string;
          bodyField?: string;
          json?: boolean;
        }
      ) => {
        const json = Boolean(opts.json);

        try {
          const { root } = detectProject();
          const result = addCollection(resolveContentDir(root), name, {
            entryPage: opts.entryPage,
            basePath: opts.basePath,
            sort: opts.sort,
            bodyField: opts.bodyField,
          });

          outputResult(result, { json }, () => {
            console.log(chalk.green(`\nCollection "${result.name}" created at ${result.path}`));
            console.log(`  Config: ${result.configPath}`);
            console.log(`  Sample: ${result.sampleEntryPath}`);
            if (result.entryPage) {
              console.log(chalk.blue('\n  Entry page generation is enabled.'));
              console.log(chalk.blue('  Run prebuild to generate entry pages.'));
            }
            console.log();
          });
        } catch (err) {
          const code = (err as NodeJS.ErrnoException).code;
          if (code === 'COLLECTION_EXISTS') {
            outputError(formatError(err), 'COLLECTION_EXISTS', { json });
          }
          outputError(formatError(err), 'ADD_FAILED', { json }, 2);
        }
      }
    );
}
