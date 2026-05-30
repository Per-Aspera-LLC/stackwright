import { Command } from 'commander';
import chalk from 'chalk';
import path from 'path';
import fs from 'fs-extra';
import { outputResult, outputError, formatError } from '../utils/json-output';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Shape of a single record in .beads/issues.jsonl */
export interface BeadsIssue {
  _type: string;
  id: string;
  title: string;
  description?: string;
  status: 'open' | 'closed';
  priority: number;
  issue_type?: 'task' | 'feature' | 'bug';
  updated_at: string;
}

export interface BoardIssue {
  id: string;
  title: string;
  issueType?: string;
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
// Pure functions (testable without filesystem)
// ---------------------------------------------------------------------------

function toBoard(raw: BeadsIssue): BoardIssue {
  return {
    id: raw.id,
    title: raw.title,
    issueType: raw.issue_type,
    updatedAt: raw.updated_at,
  };
}

function getTier(issue: BeadsIssue): PriorityTier | null {
  if (issue.priority === 1) return 'now';
  if (issue.priority === 2) return 'next';
  if (issue.priority === 3) return 'later';
  if (issue.priority === 4) return 'vision';
  return null;
}

/**
 * Parse raw beads issue data into a priority-tiered board.
 * Pure function — no I/O, fully testable.
 * Only includes open issues; closed issues are silently skipped.
 */
export function parseBoard(rawIssues: BeadsIssue[]): BoardResult {
  const result: BoardResult = { now: [], next: [], later: [], vision: [], unlabeled: [] };

  for (const raw of rawIssues) {
    if (raw._type !== 'issue' || raw.status !== 'open') continue;
    const issue = toBoard(raw);
    const tier = getTier(raw);
    if (tier) {
      result[tier].push(issue);
    } else {
      result.unlabeled.push(issue);
    }
  }

  return result;
}

// ---------------------------------------------------------------------------
// I/O: locate and parse .beads/issues.jsonl
// ---------------------------------------------------------------------------

/**
 * Walk up from startDir looking for .beads/issues.jsonl.
 * Throws BEADS_NOT_FOUND if not found.
 */
function findBeadsFile(startDir: string): string {
  let dir = startDir;
  while (true) {
    const candidate = path.join(dir, '.beads', 'issues.jsonl');
    if (fs.existsSync(candidate)) return candidate;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  const err = new Error('No .beads/issues.jsonl found. Run `bd init` to set up issue tracking.');
  (err as NodeJS.ErrnoException).code = 'BEADS_NOT_FOUND';
  throw err;
}

async function loadBeadsIssues(cwd?: string): Promise<BeadsIssue[]> {
  const effectiveCwd = cwd ?? process.cwd();
  const jsonlPath = findBeadsFile(effectiveCwd);
  const content = await fs.readFile(jsonlPath, 'utf8');
  return content
    .split('\n')
    .filter(Boolean)
    .map((line) => JSON.parse(line) as BeadsIssue);
}

/**
 * Load issues from .beads/issues.jsonl and organize into a priority board.
 */
export async function getBoard(cwd?: string): Promise<BoardResult> {
  const raw = await loadBeadsIssues(cwd);
  return parseBoard(raw);
}

// ---------------------------------------------------------------------------
// Formatting helpers
// ---------------------------------------------------------------------------

function formatIssue(issue: BoardIssue): string {
  const id = chalk.dim(issue.id);
  const badge = issue.issueType ? chalk.dim(` [${issue.issueType.slice(0, 4)}]`) : '';
  return `  ${id.padEnd(28)}${badge.padEnd(8)}${issue.title}`;
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
    .description('Show the priority-tiered product board from .beads/issues.jsonl')
    .option('--json', 'Output machine-readable JSON')
    .action(async (opts: { json?: boolean }) => {
      const json = Boolean(opts.json);
      try {
        const board = await getBoard();
        outputResult(board, { json }, () => {
          process.stdout.write(formatBoard(board));
        });
      } catch (err: unknown) {
        const code = (err as NodeJS.ErrnoException).code;
        if (code === 'BEADS_NOT_FOUND') {
          outputError(formatError(err), 'BEADS_NOT_FOUND', { json });
        } else {
          outputError(formatError(err), 'BOARD_FAILED', { json }, 2);
        }
      }
    });
}
