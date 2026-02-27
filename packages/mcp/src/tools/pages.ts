import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import path from 'path';
import { listPages, addPage, validatePages } from '@stackwright/cli';

const PAGES_SUBDIR = 'content/pages';

function pagesDir(projectRoot: string): string {
  return path.join(projectRoot, PAGES_SUBDIR);
}

export function registerPageTools(server: McpServer): void {
  server.tool(
    'stackwright_list_pages',
    'List all pages in a Stackwright project. Returns each page slug and its heading.',
    {
      projectRoot: z.string().describe('Absolute path to the root of the Stackwright project'),
    },
    async ({ projectRoot }) => {
      const result = listPages(pagesDir(projectRoot));
      const lines = result.pages.map(
        (p) => `  ${p.slug}${p.heading ? `  —  ${p.heading}` : ''}`
      );
      const text =
        result.pages.length === 0
          ? 'No pages found.'
          : `Pages (${result.pages.length}):\n${lines.join('\n')}`;
      return { content: [{ type: 'text', text }] };
    }
  );

  server.tool(
    'stackwright_add_page',
    'Create a new page in a Stackwright project. Writes a boilerplate content.yml at the given slug path.',
    {
      projectRoot: z.string().describe('Absolute path to the root of the Stackwright project'),
      slug: z.string().describe('Page slug, e.g. "about" or "team/leadership"'),
      heading: z.string().optional().describe('Optional heading for the new page'),
    },
    async ({ projectRoot, slug, heading }) => {
      const result = await addPage(pagesDir(projectRoot), slug, { heading });
      return {
        content: [
          {
            type: 'text',
            text: `Created page "${result.slug}" at ${result.path}`,
          },
        ],
      };
    }
  );

  server.tool(
    'stackwright_validate_pages',
    'Validate page YAML files against the Stackwright content schema. Returns field-level errors if validation fails.',
    {
      projectRoot: z.string().describe('Absolute path to the root of the Stackwright project'),
      slug: z.string().optional().describe('Validate only this slug; omit to validate all pages'),
    },
    async ({ projectRoot, slug }) => {
      const result = validatePages(pagesDir(projectRoot), slug);
      if (result.valid) {
        const target = slug ? `"${slug}"` : 'all pages';
        return { content: [{ type: 'text', text: `✓ Validation passed for ${target}.` }] };
      }
      const errorLines = result.errors.map(
        (e) => `  [${e.slug}] ${e.message}`
      );
      return {
        content: [
          {
            type: 'text',
            text: `Validation failed:\n${errorLines.join('\n')}`,
          },
        ],
        isError: true,
      };
    }
  );
}
