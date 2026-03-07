import { Command } from 'commander';
import chalk from 'chalk';
import { git, gh } from '../utils/git';
import { detectProject } from '../utils/project-detector';
import { validatePages } from './page';
import { validateSite } from './site';
import { outputResult, outputError, getErrorCode, formatError } from '../utils/json-output';

// ---------------------------------------------------------------------------
// Allowed content path patterns (relative to project root)
// ---------------------------------------------------------------------------

const ALLOWED_PATTERNS = [
  /^pages\/.*\.(yml|yaml)$/,
  /^pages\/.*\.(png|jpg|jpeg|gif|svg|webp)$/,
  /^content\/pages\/.*\.(yml|yaml)$/,
  /^content\/pages\/.*\.(png|jpg|jpeg|gif|svg|webp)$/,
  /^stackwright\.(yml|yaml)$/,
];

function isAllowedPath(relativePath: string): boolean {
  return ALLOWED_PATTERNS.some((p) => p.test(relativePath));
}

// ---------------------------------------------------------------------------
// Pure functions
// ---------------------------------------------------------------------------

export interface StageChangesResult {
  staged: string[];
  skipped: string[];
}

export interface StageChangesOptions {
  /** Optional explicit list of relative paths to stage (still filtered to allowed paths). */
  paths?: string[];
}

/**
 * Stage modified or new Stackwright content files.
 *
 * Runs `git status --porcelain`, filters to allowed content paths,
 * and stages them via `git add`.
 */
export async function stageChanges(
  projectRoot: string,
  options?: StageChangesOptions
): Promise<StageChangesResult> {
  const { stdout } = await git(['status', '--porcelain', '-uall'], projectRoot);
  const lines = stdout.trim().split('\n').filter(Boolean);

  const staged: string[] = [];
  const skipped: string[] = [];

  for (const line of lines) {
    // Porcelain format: "XY filename" where X=index, Y=worktree, first 3 chars are status + space
    const relativePath = line.slice(3).trim();
    if (!relativePath) continue;

    // If explicit paths are given, only consider those
    if (options?.paths && options.paths.length > 0) {
      if (!options.paths.includes(relativePath)) continue;
    }

    if (isAllowedPath(relativePath)) {
      staged.push(relativePath);
    } else {
      skipped.push(relativePath);
    }
  }

  if (staged.length > 0) {
    await git(['add', ...staged], projectRoot);
  }

  return { staged, skipped };
}

export interface OpenPrOptions {
  title?: string;
  description?: string;
  branchName?: string;
  baseBranch?: string;
  draft?: boolean;
}

export interface OpenPrResult {
  prUrl: string;
  branchName: string;
  commitHash: string;
  filesCommitted: string[];
}

function formatTimestamp(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
    '-',
    pad(date.getHours()),
    pad(date.getMinutes()),
    pad(date.getSeconds()),
  ].join('');
}

function generatePrDescription(files: string[]): string {
  const pageFiles = files.filter((f) => f.includes('pages/') && /\.(yml|yaml)$/.test(f));
  const siteFiles = files.filter((f) => /^stackwright\.(yml|yaml)$/.test(f));
  const imageFiles = files.filter((f) => /\.(png|jpg|jpeg|gif|svg|webp)$/.test(f));

  const lines: string[] = ['## Content changes', ''];
  if (pageFiles.length > 0) {
    lines.push(`**Pages** (${pageFiles.length}):`);
    for (const f of pageFiles) lines.push(`- \`${f}\``);
    lines.push('');
  }
  if (siteFiles.length > 0) {
    lines.push('**Site config** updated');
    lines.push('');
  }
  if (imageFiles.length > 0) {
    lines.push(`**Images** (${imageFiles.length}):`);
    for (const f of imageFiles) lines.push(`- \`${f}\``);
    lines.push('');
  }
  lines.push('---');
  lines.push('*Created by Stackwright MCP agent*');
  return lines.join('\n');
}

/**
 * Validate staged content, commit, push to a new branch, and open a GitHub PR.
 *
 * Aborts with VALIDATION_FAILED if any staged YAML is invalid — nothing is committed.
 * Requires the GitHub CLI (`gh`) to be installed and authenticated.
 */
export async function openPr(
  projectRoot: string,
  pagesDir: string,
  siteConfigPath: string,
  options?: OpenPrOptions
): Promise<OpenPrResult> {
  // 1. Get staged files
  const { stdout: stagedOutput } = await git(['diff', '--cached', '--name-only'], projectRoot);
  const stagedFiles = stagedOutput.trim().split('\n').filter(Boolean);

  if (stagedFiles.length === 0) {
    const err = new Error('No staged changes to commit. Run stackwright_stage_changes first.');
    (err as NodeJS.ErrnoException).code = 'NO_STAGED_CHANGES';
    throw err;
  }

  // 2. Validate staged YAML files
  const pageYamlFiles = stagedFiles.filter((f) => f.includes('pages/') && /\.(yml|yaml)$/.test(f));
  const siteYamlFiles = stagedFiles.filter((f) => /^stackwright\.(yml|yaml)$/.test(f));

  if (pageYamlFiles.length > 0) {
    const result = validatePages(pagesDir);
    if (!result.valid) {
      const errorDetails = result.errors.map((e) => `  [${e.slug}] ${e.message}`).join('\n');
      const err = new Error(`Page validation failed:\n${errorDetails}`);
      (err as NodeJS.ErrnoException).code = 'VALIDATION_FAILED';
      throw err;
    }
  }

  if (siteYamlFiles.length > 0) {
    const result = validateSite(siteConfigPath);
    if (!result.valid) {
      const errorDetails = result.errors.map((e) => `  [${e.field}] ${e.message}`).join('\n');
      const err = new Error(`Site config validation failed:\n${errorDetails}`);
      (err as NodeJS.ErrnoException).code = 'VALIDATION_FAILED';
      throw err;
    }
  }

  // 3. Save current branch and create a new one
  const { stdout: currentBranchRaw } = await git(
    ['rev-parse', '--abbrev-ref', 'HEAD'],
    projectRoot
  );
  const currentBranch = currentBranchRaw.trim();
  const branchName = options?.branchName ?? `content/agent-${formatTimestamp(new Date())}`;

  await git(['checkout', '-b', branchName], projectRoot);

  try {
    // 4. Commit
    const title = options?.title ?? `Content update: ${stagedFiles.length} file(s)`;
    const description = options?.description ?? generatePrDescription(stagedFiles);
    const commitMessage = description ? `${title}\n\n${description}` : title;
    await git(['commit', '-m', commitMessage], projectRoot);

    // 5. Push to origin
    await git(['push', '-u', 'origin', branchName], projectRoot);

    // 6. Open PR via gh CLI
    const ghArgs = ['pr', 'create', '--title', title, '--body', description];
    if (options?.baseBranch) ghArgs.push('--base', options.baseBranch);
    if (options?.draft) ghArgs.push('--draft');
    const { stdout: prUrlRaw } = await gh(ghArgs, projectRoot);
    const prUrl = prUrlRaw.trim();

    // 7. Get commit hash
    const { stdout: commitHashRaw } = await git(['rev-parse', 'HEAD'], projectRoot);
    const commitHash = commitHashRaw.trim();

    return { prUrl, branchName, commitHash, filesCommitted: stagedFiles };
  } finally {
    // 8. Return to original branch (even on error)
    await git(['checkout', currentBranch], projectRoot).catch(() => {
      // Best-effort: if we can't return, don't mask the original error
    });
  }
}

// ---------------------------------------------------------------------------
// Commander registration
// ---------------------------------------------------------------------------

export function registerGitOps(program: Command): void {
  const gitCmd = program.command('git').description('Git operations for content workflow');

  gitCmd
    .command('stage')
    .description('Stage modified or new Stackwright content files')
    .option('--json', 'Output machine-readable JSON')
    .action(async (opts: { json?: boolean }) => {
      const json = Boolean(opts.json);
      try {
        const { root } = detectProject();
        const result = await stageChanges(root);
        outputResult(result, { json }, () => {
          if (result.staged.length === 0) {
            console.log('No Stackwright content changes to stage.');
            return;
          }
          console.log(chalk.green(`Staged ${result.staged.length} file(s):`));
          for (const f of result.staged) {
            console.log(`  ${chalk.cyan('+')} ${f}`);
          }
          if (result.skipped.length > 0) {
            console.log(chalk.dim(`\nSkipped ${result.skipped.length} non-content file(s).`));
          }
        });
      } catch (err: unknown) {
        const code = getErrorCode(err);
        if (code === 'NOT_A_PROJECT') {
          outputError(formatError(err), 'NOT_A_PROJECT', { json });
        } else {
          outputError(formatError(err), code ?? 'STAGE_FAILED', { json }, 2);
        }
      }
    });

  gitCmd
    .command('open-pr')
    .description('Validate, commit, push, and open a GitHub PR for staged content changes')
    .option('--title <title>', 'PR title')
    .option('--description <description>', 'PR body/description')
    .option('--branch <name>', 'Custom branch name')
    .option('--base <branch>', 'Target branch for the PR')
    .option('--draft', 'Open as a draft PR')
    .option('--json', 'Output machine-readable JSON')
    .action(
      async (opts: {
        title?: string;
        description?: string;
        branch?: string;
        base?: string;
        draft?: boolean;
        json?: boolean;
      }) => {
        const json = Boolean(opts.json);
        try {
          const { root, pagesDir, siteConfig } = detectProject();
          const result = await openPr(root, pagesDir, siteConfig, {
            title: opts.title,
            description: opts.description,
            branchName: opts.branch,
            baseBranch: opts.base,
            draft: opts.draft,
          });
          outputResult(result, { json }, () => {
            console.log(chalk.green(`PR opened: ${result.prUrl}`));
            console.log(`  Branch: ${chalk.cyan(result.branchName)}`);
            console.log(`  Commit: ${chalk.dim(result.commitHash.slice(0, 8))}`);
            console.log(`  Files:  ${result.filesCommitted.length}`);
          });
        } catch (err: unknown) {
          const code = getErrorCode(err);
          if (code === 'NOT_A_PROJECT') {
            outputError(formatError(err), 'NOT_A_PROJECT', { json });
          } else if (code === 'VALIDATION_FAILED') {
            outputError(formatError(err), 'VALIDATION_FAILED', { json });
          } else if (code === 'NO_STAGED_CHANGES') {
            outputError(formatError(err), 'NO_STAGED_CHANGES', { json });
          } else {
            outputError(formatError(err), code ?? 'OPEN_PR_FAILED', { json }, 2);
          }
        }
      }
    );
}
