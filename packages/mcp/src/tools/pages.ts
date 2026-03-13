import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import {
  listPages,
  addPage,
  validatePages,
  readPage,
  writePage,
  resolvePagesDir,
} from '@stackwright/cli';

export function registerPageTools(server: McpServer): void {
  server.tool(
    'stackwright_list_pages',
    'List all pages in a Stackwright project. Returns each page slug and its heading.',
    {
      projectRoot: z.string().describe('Absolute path to the root of the Stackwright project'),
    },
    async ({ projectRoot }) => {
      const result = listPages(resolvePagesDir(projectRoot));
      const lines = result.pages.map((p) => `  ${p.slug}${p.heading ? `  —  ${p.heading}` : ''}`);
      const text =
        result.pages.length === 0
          ? 'No pages found.'
          : `Pages (${result.pages.length}):\n${lines.join('\n')}`;
      return { content: [{ type: 'text', text }] };
    }
  );

  server.tool(
    'stackwright_get_page',
    'Read the raw YAML content of an existing page by slug. Returns the full YAML source.',
    {
      projectRoot: z.string().describe('Absolute path to the root of the Stackwright project'),
      slug: z.string().describe('Page slug, e.g. "about" or "getting-started"'),
    },
    async ({ projectRoot, slug }) => {
      try {
        const result = readPage(resolvePagesDir(projectRoot), slug);
        return {
          content: [
            {
              type: 'text',
              text: `Page "${result.slug}" (${result.path}):\n\n${result.content}`,
            },
          ],
        };
      } catch (err) {
        const code = (err as NodeJS.ErrnoException).code;
        return {
          content: [
            {
              type: 'text',
              text:
                code === 'PAGE_NOT_FOUND'
                  ? `Page not found: "${slug}". Use stackwright_list_pages to see available pages.`
                  : `Error reading page: ${String((err as Error).message)}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.tool(
    'stackwright_write_page',
    "Write or update a page's YAML content. Validates against the content schema before writing — invalid YAML is rejected with field-level errors.",
    {
      projectRoot: z.string().describe('Absolute path to the root of the Stackwright project'),
      slug: z.string().describe('Page slug, e.g. "about" or "team/leadership"'),
      content: z.string().describe('The full YAML content for the page'),
    },
    async ({ projectRoot, slug, content }) => {
      try {
        const result = writePage(resolvePagesDir(projectRoot), slug, content);
        const verb = result.created ? 'Created' : 'Updated';
        return {
          content: [
            {
              type: 'text',
              text: `${verb} page "${result.slug}" at ${result.path}`,
            },
          ],
        };
      } catch (err) {
        const code = (err as NodeJS.ErrnoException).code;
        const message = (err as Error).message;
        return {
          content: [
            {
              type: 'text',
              text:
                code === 'VALIDATION_FAILED' || code === 'YAML_PARSE_ERROR'
                  ? message
                  : `Error writing page: ${message}`,
            },
          ],
          isError: true,
        };
      }
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
      const result = await addPage(resolvePagesDir(projectRoot), slug, { heading });
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
      const result = validatePages(resolvePagesDir(projectRoot), slug);
      if (result.valid) {
        const target = slug ? `"${slug}"` : 'all pages';
        return { content: [{ type: 'text', text: `✓ Validation passed for ${target}.` }] };
      }
      const errorLines = result.errors.map((e) => `  [${e.slug}] ${e.message}`);
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
