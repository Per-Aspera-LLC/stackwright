import fs from 'fs';
import path from 'path';
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
      const lines = result.pages.map((p) => {
        const pageDir = path.dirname(p.path);
        let localeSuffix = '  [en]';
        try {
          const localeCodes = fs
            .readdirSync(pageDir)
            .filter((f) => /^content\.[a-z]{2}(-[A-Z]{2})?\.ya?ml$/.test(f))
            .map((f) => f.match(/^content\.([^.]+)\.ya?ml$/)?.[1] ?? '')
            .filter(Boolean);
          localeSuffix = `  [${['en', ...localeCodes].join(', ')}]`;
        } catch {
          // pageDir unreadable — fall back to showing [en]
        }
        return `  ${p.slug}${p.heading ? `  —  ${p.heading}` : ''}${localeSuffix}`;
      });
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
      locale: z
        .string()
        .optional()
        .describe(
          'BCP 47 locale tag. If provided, attempts to read content.<locale>.yml; falls back to content.yml with a note.'
        ),
    },
    async ({ projectRoot, slug, locale }) => {
      if (locale) {
        if (!/^[a-z]{2}(-[A-Z]{2})?$/.test(locale)) {
          return {
            content: [
              {
                type: 'text',
                text: `Invalid locale tag: "${locale}". Expected BCP 47 format (e.g. "fr", "en-US").`,
              },
            ],
            isError: true,
          };
        }
        const pagesDir = resolvePagesDir(projectRoot);
        const cleanSlug = slug.replace(/^\//, '').replace(/\\/g, '/');
        const localePath = path.join(pagesDir, cleanSlug, `content.${locale}.yml`);
        const defaultPath = path.join(pagesDir, cleanSlug, 'content.yml');
        if (fs.existsSync(localePath)) {
          const content = fs.readFileSync(localePath, 'utf8');
          return {
            content: [
              { type: 'text', text: `Page "${slug}" [${locale}] (${localePath}):\n\n${content}` },
            ],
          };
        } else if (fs.existsSync(defaultPath)) {
          const content = fs.readFileSync(defaultPath, 'utf8');
          return {
            content: [
              {
                type: 'text',
                text: `Page "${slug}" (${defaultPath}):\n\nNote: content.${locale}.yml not found — showing default locale content.\n\n${content}`,
              },
            ],
          };
        } else {
          return {
            content: [
              {
                type: 'text',
                text: `Page not found: "${slug}". Use stackwright_list_pages to see available pages.`,
              },
            ],
            isError: true,
          };
        }
      }
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
      locale: z
        .string()
        .optional()
        .describe(
          'BCP 47 locale tag (e.g. "fr", "de"). If provided, writes content.<locale>.yml instead of content.yml.'
        ),
    },
    async ({ projectRoot, slug, content, locale }) => {
      try {
        if (locale) {
          if (!/^[a-z]{2}(-[A-Z]{2})?$/.test(locale)) {
            return {
              content: [
                {
                  type: 'text',
                  text: `Invalid locale tag: "${locale}". Expected BCP 47 format (e.g. "fr", "en-US").`,
                },
              ],
              isError: true,
            };
          }
          const pagesDir = resolvePagesDir(projectRoot);
          const cleanSlug = slug.replace(/^\//, '').replace(/\\/g, '/');
          const defaultPath = path.join(pagesDir, cleanSlug, 'content.yml');
          const localePath = path.join(pagesDir, cleanSlug, `content.${locale}.yml`);
          // Save existing content.yml so writePage (used for validation) doesn't overwrite it
          const originalDefault: string | null = fs.existsSync(defaultPath)
            ? fs.readFileSync(defaultPath, 'utf8')
            : null;
          try {
            // writePage validates YAML + schema; throws VALIDATION_FAILED / YAML_PARSE_ERROR on error.
            // Also creates the page directory via fs.ensureDirSync if needed.
            writePage(pagesDir, slug, content);
          } finally {
            // Always restore content.yml to its pre-call state
            if (originalDefault !== null) {
              fs.writeFileSync(defaultPath, originalDefault, 'utf8');
            } else if (fs.existsSync(defaultPath)) {
              fs.unlinkSync(defaultPath);
            }
          }
          // Validation passed — write the locale-specific file
          const localeCreated = !fs.existsSync(localePath);
          fs.mkdirSync(path.dirname(localePath), { recursive: true });
          fs.writeFileSync(localePath, content, 'utf8');
          const verb = localeCreated ? 'Created' : 'Updated';
          return {
            content: [
              { type: 'text', text: `${verb} locale page "${slug}" [${locale}] at ${localePath}` },
            ],
          };
        }
        // Default locale: existing behavior unchanged
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
