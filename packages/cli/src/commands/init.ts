import { Command } from 'commander';
import { input } from '@inquirer/prompts';
import path from 'path';
import fs from 'fs-extra';
import chalk from 'chalk';
import yaml from 'js-yaml';
import { promptThemeSelection } from '../utils/theme-selector';
import { outputResult, outputError, getErrorCode, formatError } from '../utils/json-output';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface InitResult {
  targetDir: string;
  siteConfigPath: string;
  siteConfigCreated: boolean;
  rootPagePath: string;
  rootPageCreated: boolean;
  theme: string;
  title: string;
  nextSteps: { command: string; description: string }[];
}

// ---------------------------------------------------------------------------
// Pure function
// ---------------------------------------------------------------------------

export async function init(
  targetDir: string,
  opts: { title?: string; theme?: string; noInteractive?: boolean; json?: boolean }
): Promise<InitResult> {
  // 1. Target directory must exist
  if (!fs.existsSync(targetDir)) {
    const err = new Error(`Target directory not found: ${targetDir}`);
    (err as NodeJS.ErrnoException).code = 'TARGET_NOT_FOUND';
    throw err;
  }

  // 2. Must have a package.json — confirms this is a Node.js project
  if (!fs.existsSync(path.join(targetDir, 'package.json'))) {
    const err = new Error(`No package.json found in ${targetDir}. Is this a Node.js project?`);
    (err as NodeJS.ErrnoException).code = 'NOT_A_NODEJS_PROJECT';
    throw err;
  }

  const nonInteractive = Boolean(opts.noInteractive) || Boolean(opts.json);
  const defaultTitle = path.basename(targetDir);

  let title = opts.title;
  let theme = opts.theme;

  if (!nonInteractive) {
    if (!title) {
      title = await input({ message: 'Site title:', default: defaultTitle });
    }
    if (!theme) {
      theme = await promptThemeSelection();
    }
  } else {
    title = title ?? defaultTitle;
    theme = theme ?? 'corporate';
  }

  // 3. Write stackwright.yml — idempotent, never overwrites
  const siteConfigPath = path.join(targetDir, 'stackwright.yml');
  const siteConfigCreated = !fs.existsSync(siteConfigPath);
  if (siteConfigCreated) {
    fs.writeFileSync(siteConfigPath, yaml.dump({ title: title!, themeName: theme! }), 'utf8');
  }

  // 4. Resolve pages dir: prefer pages/, then content/pages/, default to pages/
  const pagesDir = path.join(targetDir, 'pages');
  const contentPagesDir = path.join(targetDir, 'content', 'pages');
  const resolvedPagesDir = fs.existsSync(pagesDir)
    ? pagesDir
    : fs.existsSync(contentPagesDir)
      ? contentPagesDir
      : pagesDir;

  // 5. Write root content.yml — idempotent, never overwrites
  const rootPagePath = path.join(resolvedPagesDir, 'content.yml');
  const rootPageCreated = !fs.existsSync(rootPagePath);
  if (rootPageCreated) {
    const relativePath = path.relative(targetDir, rootPagePath);
    const pageData = {
      content: {
        content_items: [
          {
            type: 'main',
            label: 'home-hero',
            heading: { text: `Welcome to ${title!}`, textSize: 'h1' },
            textBlocks: [{ text: `Edit ${relativePath} to get started.`, textSize: 'body1' }],
          },
        ],
      },
    };
    fs.ensureDirSync(resolvedPagesDir);
    fs.writeFileSync(rootPagePath, yaml.dump(pageData), 'utf8');
  }

  return {
    targetDir,
    siteConfigPath,
    siteConfigCreated,
    rootPagePath,
    rootPageCreated,
    theme: theme!,
    title: title!,
    nextSteps: [
      {
        command: 'pnpm add @stackwright/nextjs @stackwright/themes @stackwright/icons',
        description: 'Install Stackwright dependencies',
      },
      {
        command: 'pnpm dev',
        description: 'Start the development server',
      },
    ],
  };
}

// ---------------------------------------------------------------------------
// Commander registration
// ---------------------------------------------------------------------------

export function registerInit(program: Command): void {
  program
    .command('init [dir]')
    .description('Add Stackwright to an existing Next.js project')
    .option('--title <title>', 'Site title')
    .option('--theme <themeId>', 'Theme ID — skips interactive theme selection')
    .option('--no-interactive', 'Skip all prompts, use defaults')
    .option('--json', 'Output machine-readable JSON')
    .action(
      async (
        dir: string | undefined,
        opts: { title?: string; theme?: string; noInteractive?: boolean; json?: boolean }
      ) => {
        const targetDir = path.resolve(dir ?? process.cwd());
        const json = Boolean(opts.json);

        try {
          const result = await init(targetDir, opts);
          outputResult(result, { json }, () => {
            console.log(chalk.bold('\nStackwright init\n'));
            const created = chalk.green('created');
            const skipped = chalk.dim('skipped (already exists)');
            const configRel = path.relative(targetDir, result.siteConfigPath);
            const pageRel = path.relative(targetDir, result.rootPagePath);
            console.log(
              `  ${configRel.padEnd(30)} ${result.siteConfigCreated ? created : skipped}`
            );
            console.log(`  ${pageRel.padEnd(30)} ${result.rootPageCreated ? created : skipped}`);
            console.log(chalk.bold('\nNext steps\n'));
            for (const step of result.nextSteps) {
              console.log(`  ${chalk.cyan(step.command)}`);
              console.log(`    ${chalk.dim(step.description)}`);
            }
            console.log('');
          });
        } catch (err: unknown) {
          const code = getErrorCode(err);
          if (code === 'TARGET_NOT_FOUND') {
            outputError(formatError(err), 'TARGET_NOT_FOUND', { json });
          } else if (code === 'NOT_A_NODEJS_PROJECT') {
            outputError(formatError(err), 'NOT_A_NODEJS_PROJECT', { json });
          } else {
            outputError(formatError(err), 'INIT_FAILED', { json }, 2);
          }
        }
      }
    );
}
