import { Command } from 'commander';
import chalk from 'chalk';
import { gh } from '../utils/git';
import { outputResult, outputError, formatError } from '../utils/json-output';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Shape returned by `gh issue list --json ...` for each issue. */
export interface GhIssueRaw {
  number: number;
  title: string;
  labels: { name: string }[];
  assignees: { login: string }[];
  updatedAt: string;
}

export interface BoardIssue {
  number: number;
  title: string;
  labels: string[];
  assignees: string[];
  updatedAt: string;
}

export interface BoardResult {
  now: BoardIssue[];
  next: BoardIssue[];
  later: BoardIssue[];
  vision: BoardIssue[];
  unlabeled: BoardIssue[];
}

// ---------------------------------------------------------------------------
// Priority tiers — single source of truth
// ---------------------------------------------------------------------------

type PriorityTier = 'now' | 'next' | 'later' | 'vision';

const TIER_CONFIG: Record<PriorityTier, { emoji: string; color: (s: string) => string }> = {
  now: { emoji: '🔴', color: chalk.red },
  next: { emoji: '🟡', color: chalk.yellow },
  later: { emoji: '🟢', color: chalk.green },
  vision: { emoji: '🟣', color: chalk.magenta },
};

// ---------------------------------------------------------------------------
// Pure functions (testable without GitHub)
// ---------------------------------------------------------------------------

function toBoard(raw: GhIssueRaw): BoardIssue {
  return {
    number: raw.number,
    title: raw.title,
    labels: raw.labels.map((l) => l.name),
    assignees: raw.assignees.map((a) => a.login),
    updatedAt: raw.updatedAt,
  };
}

function getTier(issue: BoardIssue): PriorityTier | null {
  for (const label of issue.labels) {
    if (label.startsWith('priority:')) {
      const tier = label.slice('priority:'.length);
      if (tier === 'now' || tier === 'next' || tier === 'later' || tier === 'vision') {
        return tier;
      }
    }
  }
  return null;
}

/**
 * Parse raw GitHub issue data into a priority-tiered board.
 * Pure function — no I/O, fully testable.
 */
export function parseBoard(rawIssues: GhIssueRaw[]): BoardResult {
  const result: BoardResult = { now: [], next: [], later: [], vision: [], unlabeled: [] };

  for (const raw of rawIssues) {
    const issue = toBoard(raw);
    const tier = getTier(issue);
    if (tier) {
      result[tier].push(issue);
    } else {
      result.unlabeled.push(issue);
    }
  }

  return result;
}

// ---------------------------------------------------------------------------
// I/O: fetch issues via gh CLI
// ---------------------------------------------------------------------------

async function fetchIssues(cwd?: string): Promise<GhIssueRaw[]> {
  const args = [
    'issue',
    'list',
    '--state',
    'open',
    '--json',
    'number,title,labels,assignees,updatedAt',
    '--limit',
    '100',
  ];

  const effectiveCwd = cwd ?? process.cwd();
  const { stdout } = await gh(args, effectiveCwd);
  return JSON.parse(stdout) as GhIssueRaw[];
}

/**
 * Fetch open GitHub issues and organize them into a priority board.
 * Requires `gh` CLI to be installed and authenticated.
 */
export async function getBoard(cwd?: string): Promise<BoardResult> {
  const raw = await fetchIssues(cwd);
  return parseBoard(raw);
}

// ---------------------------------------------------------------------------
// Formatting helpers
// ---------------------------------------------------------------------------

function formatIssue(issue: BoardIssue): string {
  const num = chalk.dim(`#${issue.number}`);
  const assignee = issue.assignees.length > 0 ? chalk.dim(` (${issue.assignees.join(', ')})`) : '';
  return `  ${num.padEnd(16)}${issue.title}${assignee}`;
}

function formatTier(tier: PriorityTier, issues: BoardIssue[]): string {
  const { emoji, color } = TIER_CONFIG[tier];
  const header = color(`${emoji} ${tier.toUpperCase()}`);

  if (issues.length === 0) {
    return `${header}\n  ${chalk.dim('(none)')}\n`;
  }

  const lines = issues.map(formatIssue);
  return `${header}\n${lines.join('\n')}\n`;
}

function formatBoard(board: BoardResult): string {
  const sections: string[] = [
    formatTier('now', board.now),
    formatTier('next', board.next),
    formatTier('later', board.later),
    formatTier('vision', board.vision),
  ];

  if (board.unlabeled.length > 0) {
    const header = chalk.gray('⚪ UNLABELED');
    const lines = board.unlabeled.map(formatIssue);
    sections.push(`${header}\n${lines.join('\n')}\n`);
  }

  const total =
    board.now.length +
    board.next.length +
    board.later.length +
    board.vision.length +
    board.unlabeled.length;

  return `\n${sections.join('\n')}${chalk.dim(`${total} open issue(s)`)}\n`;
}

// ---------------------------------------------------------------------------
// Commander registration
// ---------------------------------------------------------------------------

export function registerBoard(program: Command): void {
  program
    .command('board')
    .description('Show the priority-tiered product board from GitHub Issues')
    .option('--json', 'Output machine-readable JSON')
    .action(async (opts: { json?: boolean }) => {
      const json = Boolean(opts.json);
      try {
        const board = await getBoard();
        outputResult(board, { json }, () => {
          process.stdout.write(formatBoard(board));
        });
      } catch (err: unknown) {
        outputError(formatError(err), 'BOARD_FAILED', { json }, 2);
      }
    });
}
