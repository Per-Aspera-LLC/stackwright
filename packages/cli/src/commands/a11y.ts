import { Command } from 'commander';
import chalk from 'chalk';
import { detectProject } from '../utils/project-detector';
import { discoverPageSlugs } from '../utils/a11y-page-discovery';
import { runA11yAudit } from '../utils/a11y-runner';
import type { A11yAuditResult, A11yRunnerOptions } from '../utils/a11y-runner';
import { outputResult, outputError, getErrorCode } from '../utils/json-output';

export type { A11yAuditResult };

export interface TestA11yOptions {
  baseUrl?: string;
  pages?: string; // comma-separated slugs
  darkMode?: boolean; // default true (tests both light + dark)
  tags?: string; // comma-separated axe rule tags
  failOn?: string; // 'minor' | 'moderate' | 'serious' | 'critical'
  json?: boolean;
}

/**
 * Pure function — run an accessibility audit for a Stackwright project.
 * Auto-discovers pages from the project's pages directory if no slugs provided.
 */
export async function testA11y(
  projectRoot: string,
  opts: TestA11yOptions
): Promise<A11yAuditResult> {
  const baseUrl = opts.baseUrl ?? 'http://localhost:3000';

  // Resolve slugs: explicit list or auto-discover
  let slugs: string[];
  if (opts.pages) {
    slugs = opts.pages
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  } else {
    slugs = discoverPageSlugs(projectRoot);
    if (slugs.length === 0) {
      const err = new Error('No pages found. Run stackwright prebuild first or specify --pages.');
      (err as NodeJS.ErrnoException).code = 'NO_PAGES';
      throw err;
    }
  }

  const modes: ('light' | 'dark')[] = opts.darkMode === false ? ['light'] : ['light', 'dark'];

  const tags = opts.tags
    ? opts.tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean)
    : undefined;

  const failOn = (opts.failOn as A11yRunnerOptions['failOn']) ?? 'serious';

  return runA11yAudit({ baseUrl, slugs, modes, tags, failOn });
}

// ---------------------------------------------------------------------------
// Human-readable formatter
// ---------------------------------------------------------------------------

function formatAuditResult(result: A11yAuditResult): void {
  const { summary } = result;

  console.log('');
  console.log(chalk.bold('♿  Stackwright Accessibility Audit'));
  console.log(chalk.dim(`   Base URL: ${result.baseUrl}`));
  console.log(chalk.dim(`   Modes:    ${result.modes.join(', ')}`));
  console.log('');

  for (const pageResult of result.results) {
    const icon = pageResult.pass ? chalk.green('✓') : chalk.red('✗');
    const modeLabel = chalk.dim(`[${pageResult.mode}]`);
    const label = `${icon} ${chalk.bold(pageResult.slug)} ${modeLabel}`;

    if (pageResult.pass) {
      console.log(`  ${label}`);
    } else {
      console.log(`  ${label}`);
      for (const v of pageResult.failingViolations) {
        const impact = v.impact ?? 'unknown';
        const impactColor =
          impact === 'critical' ? chalk.red : impact === 'serious' ? chalk.yellow : chalk.dim;
        console.log(
          `      ${impactColor(`[${impact}]`)} ${v.id}: ${v.help} (${v.nodeCount} node${v.nodeCount !== 1 ? 's' : ''})`
        );
        console.log(`         ${chalk.dim(v.helpUrl)}`);
      }
    }
  }

  console.log('');
  const summaryLine = `  ${summary.total} scan${summary.total !== 1 ? 's' : ''} — ${chalk.green(`${summary.passed} passed`)}, ${summary.failed > 0 ? chalk.red(`${summary.failed} failed`) : chalk.green('0 failed')}`;
  console.log(summaryLine);

  if (summary.violations > 0) {
    console.log(
      chalk.dim(
        `  ${summary.violations} total violation${summary.violations !== 1 ? 's' : ''} found`
      )
    );
  }

  console.log('');

  if (result.pass) {
    console.log(chalk.green('  ✓ All pages pass WCAG 2.1 AA'));
  } else {
    console.log(chalk.red('  ✗ Accessibility violations found — see details above'));
  }

  console.log('');
}

// ---------------------------------------------------------------------------
// Commander registration
// ---------------------------------------------------------------------------

export function registerTestA11y(program: Command): void {
  program
    .command('test:a11y [slug]')
    .description(
      'Run a WCAG 2.1 AA accessibility audit against a running Stackwright dev server.\n' +
        'Auto-discovers pages from the project. Requires: pnpm dev (running) + playwright installed.'
    )
    .option('--base-url <url>', 'Dev server URL (default: http://localhost:3000)')
    .option(
      '--pages <slugs>',
      'Comma-separated page slugs to test (default: auto-discover all pages)'
    )
    .option('--no-dark-mode', 'Skip dark mode testing (test light mode only)')
    .option(
      '--tags <tags>',
      'Comma-separated axe rule tags (default: wcag2a,wcag2aa,wcag21a,wcag21aa)'
    )
    .option(
      '--fail-on <level>',
      'Minimum violation impact level that fails the audit: minor|moderate|serious|critical (default: serious)',
      'serious'
    )
    .option('--json', 'Output machine-readable JSON')
    .action(async (slug: string | undefined, opts: TestA11yOptions & { darkMode?: boolean }) => {
      // If a positional slug was given, treat it as --pages
      if (slug) {
        opts.pages = slug;
      }

      const json = Boolean(opts.json);

      try {
        const project = detectProject();
        const result = await testA11y(project.root, opts);

        if (result.pass) {
          outputResult(result, { json }, () => formatAuditResult(result));
        } else {
          // Violations found — output the result then exit 1
          if (json) {
            process.stdout.write(JSON.stringify(result, null, 2) + '\n');
          } else {
            formatAuditResult(result);
          }
          process.exit(1);
        }
      } catch (err) {
        const code = getErrorCode(err);
        if (
          code === 'NO_DEV_SERVER' ||
          code === 'MISSING_PLAYWRIGHT' ||
          code === 'MISSING_AXE' ||
          code === 'NO_PAGES' ||
          code === 'NOT_A_PROJECT'
        ) {
          outputError(String((err as Error).message), code, { json });
        } else {
          outputError(String((err as Error).message), 'A11Y_AUDIT_FAILED', { json }, 2);
        }
      }
    });
}
