import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { getInfo, scaffold } from '@stackwright/cli';

export function registerProjectTools(server: McpServer): void {
  server.tool(
    'stackwright_get_project_info',
    'Get information about a Stackwright project: installed package versions, active theme, and page count.',
    {
      projectRoot: z.string().describe('Absolute path to the root of the Stackwright project'),
    },
    async ({ projectRoot }) => {
      const info = getInfo(projectRoot);
      const pkgLines = Object.entries(info.packages)
        .filter(([, v]) => v !== null)
        .map(([k, v]) => `    ${k}: ${v}`);
      const text = [
        `Project root: ${info.project.root}`,
        `Site title:   ${info.site.title ?? '(not set)'}`,
        `Active theme: ${info.site.theme ?? '(not set)'}`,
        `Pages:        ${info.pageCount}`,
        'Packages:',
        ...pkgLines,
      ].join('\n');
      return { content: [{ type: 'text', text }] };
    }
  );

  server.tool(
    'stackwright_scaffold_project',
    'Scaffold a new Stackwright Next.js project at the given target directory.',
    {
      targetDir: z.string().describe('Absolute path where the new project should be created'),
      name: z.string().optional().describe('npm package name for the new project'),
      title: z
        .string()
        .optional()
        .describe('Site title (used in stackwright.yml and page metadata)'),
      theme: z
        .string()
        .optional()
        .describe('Theme ID to use (run stackwright_list_themes to see options)'),
      force: z
        .boolean()
        .optional()
        .default(true)
        .describe('Allow scaffolding in non-empty directories (default: true for agents)'),
      monorepo: z
        .boolean()
        .optional()
        .describe('Use workspace:* dependencies for monorepo development. Auto-detected if omitted.'),
      pages: z
        .string()
        .optional()
        .describe('Comma-separated list of page slugs to create (e.g., "about,contact,pricing")'),
    },
    async ({ targetDir, name, title, theme, force, monorepo, pages }) => {
      const result = await scaffold(targetDir, { name, title, theme, force, monorepo, pages, json: true });
      const text = [
        `Scaffolded project at: ${result.path}`,
        `Theme: ${result.theme}`,
        `Sample pages: ${result.pages.join(', ')}`,
      ].join('\n');
      return { content: [{ type: 'text', text }] };
    }
  );
}
