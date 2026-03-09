import { Command } from 'commander';
import { input } from '@inquirer/prompts';
import path from 'path';
import fs from 'fs-extra';
import chalk from 'chalk';
import { promptThemeSelection } from '../utils/theme-selector';
import { processTemplate } from '../utils/template-processor';
import { outputResult, outputError } from '../utils/json-output';

export interface ScaffoldOptions {
  name?: string;
  title?: string;
  theme?: string;
  json?: boolean;
  offline?: boolean;
}

export interface ScaffoldResult {
  path: string;
  pages: string[];
  theme: string;
}

export async function scaffold(targetDir: string, opts: ScaffoldOptions): Promise<ScaffoldResult> {
  const json = Boolean(opts.json);

  // Validate target directory
  if (fs.existsSync(targetDir) && fs.readdirSync(targetDir).length > 0) {
    outputError(`Directory ${targetDir} already exists and is not empty`, 'DIR_EXISTS', { json });
  }

  let { name, title, theme } = opts;

  if (!json) {
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
    offline: opts.offline,
  });

  return { path: targetDir, pages, theme: theme! };
}

export function registerScaffold(program: Command): void {
  program
    .command('scaffold [dir]')
    .description('Create a new Stackwright project')
    .option('--name <name>', 'Project name (used in package.json)')
    .option('--title <title>', 'Site title shown in the app bar and browser tab')
    .option('--theme <themeId>', 'Theme ID — skips interactive theme selection')
    .option('--offline', 'Use bundled templates (skip GitHub template fetch)')
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
        const msg = err instanceof Error ? err.message : String(err);
        outputError(msg, 'SCAFFOLD_FAILED', { json }, 2);
      }
    });
}
