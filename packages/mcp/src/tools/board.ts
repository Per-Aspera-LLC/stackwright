import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { getBoard } from '@stackwright/cli';

export function registerBoardTools(server: McpServer): void {
  server.tool(
    'stackwright_get_board',
    'Get the priority-tiered product board from .beads/issues.jsonl. Returns open issues organized by priority: now (p1) / next (p2) / later (p3) / vision (p4).',
    {
      cwd: z
        .string()
        .optional()
        .describe(
          'Working directory to search for .beads/issues.jsonl (walks up from cwd). Defaults to process.cwd().'
        ),
    },
    async ({ cwd }) => {
      const board = await getBoard(cwd);

      const tiers: { label: string; emoji: string; issues: typeof board.now }[] = [
        { label: 'NOW', emoji: '🔴', issues: board.now },
        { label: 'NEXT', emoji: '🟡', issues: board.next },
        { label: 'LATER', emoji: '🟢', issues: board.later },
        { label: 'VISION', emoji: '🟣', issues: board.vision },
      ];

      const sections = tiers.map(({ label, emoji, issues }) => {
        if (issues.length === 0) return `${emoji} ${label}\n  (none)`;
        const lines = issues.map(
          (i) => `  ${i.id}${i.issueType ? ` [${i.issueType}]` : ''}  ${i.title}`
        );
        return `${emoji} ${label}\n${lines.join('\n')}`;
      });

      if (board.unlabeled.length > 0) {
        const lines = board.unlabeled.map((i) => `  ${i.id}  ${i.title}`);
        sections.push(`⚪ UNLABELED\n${lines.join('\n')}`);
      }

      const total =
        board.now.length +
        board.next.length +
        board.later.length +
        board.vision.length +
        board.unlabeled.length;

      const text = `${sections.join('\n\n')}\n\n${total} open issue(s)`;
      return { content: [{ type: 'text', text }] };
    }
  );
}
