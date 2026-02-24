import { Command } from 'commander';
import path from 'path';
import fs from 'fs-extra';
import chalk from 'chalk';
import yaml from 'js-yaml';
import { detectProject } from '../utils/project-detector';
import { listPages } from './page';
import { outputResult, outputError, getErrorCode, formatError } from '../utils/json-output';

// ---------------------------------------------------------------------------
// Pure function
// ---------------------------------------------------------------------------

export interface PackageVersions {
  core: string | null;
  nextjs: string | null;
  themes: string | null;
  types: string | null;
  icons: string | null;
  buildScripts: string | null;
}

export interface InfoResult {
  project: {
    root: string;
    siteConfig: string;
  };
  site: {
    title: string | null;
    theme: string | null;
  };
  packages: PackageVersions;
  pageCount: number;
}

function readPackageVersion(packageName: string, projectRoot: string): string | null {
  try {
    const pkgPath = require.resolve(`${packageName}/package.json`, {
      paths: [projectRoot],
    });
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8')) as { version?: string };
    return pkg.version ?? null;
  } catch {
    return null;
  }
}

export function getInfo(projectRoot?: string): InfoResult {
  const { root, siteConfig, pagesDir } = detectProject(projectRoot);

  let title: string | null = null;
  let theme: string | null = null;
  try {
    const rawConfig = yaml.load(fs.readFileSync(siteConfig, 'utf8')) as Record<string, unknown>;
    title = (rawConfig?.title as string | undefined) ?? null;
    theme =
      (rawConfig?.themeName as string | undefined) ??
      ((rawConfig?.customTheme as Record<string, unknown> | undefined)?.id as string | undefined) ??
      null;
  } catch {
    // Config unreadable — report what we can
  }

  const { pages } = listPages(pagesDir);

  const packages: PackageVersions = {
    core: readPackageVersion('@stackwright/core', root),
    nextjs: readPackageVersion('@stackwright/nextjs', root),
    themes: readPackageVersion('@stackwright/themes', root),
    types: readPackageVersion('@stackwright/types', root),
    icons: readPackageVersion('@stackwright/icons', root),
    buildScripts: readPackageVersion('@stackwright/build-scripts', root),
  };

  return {
    project: { root, siteConfig },
    site: { title, theme },
    packages,
    pageCount: pages.length,
  };
}

// ---------------------------------------------------------------------------
// Commander registration
// ---------------------------------------------------------------------------

export function registerInfo(program: Command): void {
  program
    .command('info')
    .description('Show project metadata and installed Stackwright package versions')
    .option('--json', 'Output machine-readable JSON')
    .action((opts: { json?: boolean }) => {
      const json = Boolean(opts.json);
      try {
        const result = getInfo();
        outputResult(result, { json }, () => {
          console.log(chalk.bold('\nProject\n'));
          console.log(`  Root:        ${result.project.root}`);
          console.log(`  Site config: ${result.project.siteConfig}`);
          console.log(`  Title:       ${result.site.title ?? chalk.dim('(not set)')}`);
          console.log(`  Theme:       ${result.site.theme ?? chalk.dim('(not set)')}`);
          console.log(`  Pages:       ${result.pageCount}`);

          console.log(chalk.bold('\nInstalled packages\n'));
          const pkgEntries: [string, string | null][] = [
            ['@stackwright/core', result.packages.core],
            ['@stackwright/nextjs', result.packages.nextjs],
            ['@stackwright/themes', result.packages.themes],
            ['@stackwright/types', result.packages.types],
            ['@stackwright/icons', result.packages.icons],
            ['@stackwright/build-scripts', result.packages.buildScripts],
          ];
          for (const [name, version] of pkgEntries) {
            const label = name.padEnd(32);
            const ver = version ? chalk.green(version) : chalk.dim('not installed');
            console.log(`  ${label} ${ver}`);
          }
          console.log('');
        });
      } catch (err: unknown) {
        if (getErrorCode(err) === 'NOT_A_PROJECT') {
          outputError(formatError(err), 'NOT_A_PROJECT', { json });
        } else {
          outputError(formatError(err), 'INFO_FAILED', { json }, 2);
        }
      }
    });
}
