import { Command } from 'commander';
import { input } from '@inquirer/prompts';
import path from 'path';
import fs from 'fs-extra';
import chalk from 'chalk';
import { promptThemeSelection } from '../utils/theme-selector';
import { processTemplate } from '../utils/template-processor';
import { outputResult, outputError, getErrorCode, formatError } from '../utils/json-output';

export interface ScaffoldOptions {
  name?: string;
  title?: string;
  theme?: string;
  json?: boolean;
  online?: boolean; // was: offline?: boolean;
  force?: boolean;
  noInteractive?: boolean;
  monorepo?: boolean;
  standalone?: boolean;
  pages?: string;
}

export interface ScaffoldResult {
  path: string;
  pages: string[];
  theme: string;
  dependencyMode: 'workspace' | 'standalone';
  siteConfigPath: string;
  pagesDir: string;
  nextSteps: { command: string; description: string }[];
}

function determineDependencyMode(
  targetDir: string,
  opts: ScaffoldOptions
): 'workspace' | 'standalone' {
  if (opts.standalone) return 'standalone';
  if (opts.monorepo) return 'workspace';
  // Auto-detect: check for pnpm-workspace.yaml up the tree
  let dir = path.resolve(targetDir);
  while (true) {
    if (fs.existsSync(path.join(dir, 'pnpm-workspace.yaml'))) return 'workspace';
    const parent = path.dirname(dir);
    if (parent === dir) return 'standalone';
    dir = parent;
  }
}

export async function scaffold(targetDir: string, opts: ScaffoldOptions): Promise<ScaffoldResult> {
  // Validate target directory (skip if --force)
  if (!opts.force && fs.existsSync(targetDir) && fs.readdirSync(targetDir).length > 0) {
    const err = new Error(
      `Directory ${targetDir} already exists and is not empty. Use --force to overwrite.`
    );
    (err as NodeJS.ErrnoException).code = 'DIR_EXISTS';
    throw err;
  }

  const nonInteractive = Boolean(opts.json) || Boolean(opts.noInteractive);

  let { name, title, theme } = opts;

  if (!nonInteractive) {
    // Interactive mode — prompt for anything not supplied as flags
    if (!name) {
      name = await input({
        message: 'Project name:',
        default: path.basename(targetDir),
      });
    }
    if (!title) {
      title = await input({
        message: 'Site title:',
        default: name,
      });
    }
    if (!theme) {
      theme = await promptThemeSelection();
    }
  } else {
    // Non-interactive fallbacks
    name = name ?? path.basename(targetDir);
    title = title ?? name;
    theme = theme ?? 'corporate';
  }

  const pages = await processTemplate({
    projectName: name!,
    siteTitle: title!,
    themeId: theme!,
    targetDir,
    offline: !opts.online, // was: offline: opts.offline
    monorepo: opts.monorepo,
    standalone: opts.standalone,
    pages: opts.pages,
  });

  const dependencyMode = determineDependencyMode(targetDir, opts);

  return {
    path: targetDir,
    pages,
    theme: theme!,
    dependencyMode,
    siteConfigPath: path.join(targetDir, 'stackwright.yml'),
    pagesDir: path.join(targetDir, 'pages'),
    nextSteps: [
      { command: `cd ${targetDir}`, description: 'Enter the project directory' },
      { command: 'pnpm install', description: 'Install dependencies' },
      { command: 'pnpm dev', description: 'Start the development server' },
    ],
  };
}

export function registerScaffold(program: Command): void {
  program
    .command('scaffold [dir]')
    .description('Create a new Stackwright project')
    .option('--name <name>', 'Project name (used in package.json)')
    .option('--title <title>', 'Site title shown in the app bar and browser tab')
    .option('--theme <themeId>', 'Theme ID — skips interactive theme selection')
    .option('--online', 'Fetch templates from GitHub instead of using bundled templates')
    .option('--force', 'Scaffold even if the target directory is not empty')
    .option('--no-interactive', 'Skip all interactive prompts, use defaults for missing values')
    .option('--monorepo', 'Use workspace:* dependencies (for development inside a pnpm monorepo)')
    .option('--standalone', 'Use versioned npm dependencies (overrides monorepo auto-detection)')
    .option(
      '--pages <slugs>',
      'Comma-separated list of page slugs to create (e.g., about,contact,pricing)'
    )
    .option('--json', 'Output machine-readable JSON')
    .action(async (dir: string | undefined, opts: ScaffoldOptions) => {
      const targetDir = path.resolve(dir ?? process.cwd());
      const json = Boolean(opts.json);

      try {
        const result = await scaffold(targetDir, opts);
        outputResult(result, { json }, () => {
          console.log(chalk.green(`\nProject created at ${result.path}`));
          console.log(
            chalk.blue(
              `\nNext steps:\n  cd ${path.relative(process.cwd(), result.path) || '.'}\n  pnpm install\n  pnpm dev`
            )
          );
        });
      } catch (err) {
        const code = getErrorCode(err);
        if (code === 'DIR_EXISTS') {
          outputError(formatError(err), 'DIR_EXISTS', { json });
        }
        outputError(formatError(err), 'SCAFFOLD_FAILED', { json }, 2);
      }
    });
}
