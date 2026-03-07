import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import path from 'path';
import fs from 'fs';
import { stageChanges, openPr } from '@stackwright/cli';

const PAGES_SUBDIR = 'content/pages';

function pagesDir(projectRoot: string): string {
  return path.join(projectRoot, PAGES_SUBDIR);
}

function resolveSiteConfig(projectRoot: string): string {
  const candidates = ['stackwright.yml', 'stackwright.yaml'];
  for (const name of candidates) {
    const p = path.join(projectRoot, name);
    if (fs.existsSync(p)) return p;
  }
  return path.join(projectRoot, 'stackwright.yml');
}

export function registerGitOpsTools(server: McpServer): void {
  server.tool(
    'stackwright_stage_changes',
    'Stage modified or new Stackwright content files (page YAML, site config, co-located images) for commit. Only content files are staged — arbitrary files are ignored for safety.',
    {
      projectRoot: z.string().describe('Absolute path to the root of the Stackwright project'),
      paths: z
        .array(z.string())
        .optional()
        .describe(
          'Optional list of specific relative paths to stage (still filtered to allowed content paths)'
        ),
    },
    async ({ projectRoot, paths }) => {
      try {
        const result = await stageChanges(projectRoot, { paths });
        if (result.staged.length === 0) {
          return {
            content: [{ type: 'text', text: 'No Stackwright content changes detected to stage.' }],
          };
        }
        const lines = result.staged.map((f) => `  + ${f}`);
        let text = `Staged ${result.staged.length} file(s):\n${lines.join('\n')}`;
        if (result.skipped.length > 0) {
          text += `\n\nSkipped ${result.skipped.length} non-content file(s):\n${result.skipped.map((f) => `  - ${f}`).join('\n')}`;
        }
        return { content: [{ type: 'text', text }] };
      } catch (err) {
        return {
          content: [{ type: 'text', text: `Error staging changes: ${(err as Error).message}` }],
          isError: true,
        };
      }
    }
  );

  server.tool(
    'stackwright_open_pr',
    'Validate all staged YAML, commit changes, push to a new branch, and open a GitHub pull request. Requires the GitHub CLI (gh) to be installed and authenticated. Aborts if validation fails — invalid YAML is never committed.',
    {
      projectRoot: z.string().describe('Absolute path to the root of the Stackwright project'),
      title: z.string().optional().describe('PR title (auto-generated from file list if omitted)'),
      description: z
        .string()
        .optional()
        .describe('PR body/description (auto-generated summary if omitted)'),
      branchName: z
        .string()
        .optional()
        .describe('Custom branch name (default: content/agent-<timestamp>)'),
      baseBranch: z
        .string()
        .optional()
        .describe('Target branch for the PR (default: repo default branch)'),
      draft: z.boolean().optional().describe('Open as a draft PR (default: false)'),
    },
    async ({ projectRoot, title, description, branchName, baseBranch, draft }) => {
      try {
        const result = await openPr(
          projectRoot,
          pagesDir(projectRoot),
          resolveSiteConfig(projectRoot),
          { title, description, branchName, baseBranch, draft }
        );
        const text = [
          `Pull request opened: ${result.prUrl}`,
          `Branch: ${result.branchName}`,
          `Commit: ${result.commitHash.slice(0, 8)}`,
          `Files committed (${result.filesCommitted.length}):`,
          ...result.filesCommitted.map((f) => `  ${f}`),
        ].join('\n');
        return { content: [{ type: 'text', text }] };
      } catch (err) {
        const code = (err as NodeJS.ErrnoException).code;
        const message = (err as Error).message;
        let text: string;
        if (code === 'VALIDATION_FAILED') {
          text = `Cannot open PR — validation failed:\n${message}`;
        } else if (code === 'NO_STAGED_CHANGES') {
          text = 'No staged changes to commit. Use stackwright_stage_changes first.';
        } else if (code === 'GH_ERROR') {
          text = `GitHub CLI error: ${message}\nEnsure "gh" is installed and authenticated (https://cli.github.com/).`;
        } else {
          text = `Error opening PR: ${message}`;
        }
        return { content: [{ type: 'text', text }], isError: true };
      }
    }
  );
}
