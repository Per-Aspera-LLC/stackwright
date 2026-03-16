import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import path from 'path';
import { z } from 'zod';
import { listCollections, addCollection, resolveContentDir } from '@stackwright/cli';

export function registerCollectionTools(server: McpServer): void {
  server.tool(
    'stackwright_list_collections',
    'List all collections in a Stackwright project. Shows collection names, entry counts, and whether entry page generation is configured.',
    {
      projectRoot: z
        .string()
        .refine((p) => path.isAbsolute(p), 'projectRoot must be an absolute path')
        .describe('Absolute path to the root of the Stackwright project'),
    },
    async ({ projectRoot }) => {
      const result = listCollections(resolveContentDir(projectRoot));
      if (result.collections.length === 0) {
        return {
          content: [
            {
              type: 'text' as const,
              text: 'No collections found. Create one with stackwright_create_collection.',
            },
          ],
        };
      }

      const lines = result.collections.map((c) => {
        const entryPage = c.hasEntryPage ? ` → entry pages at ${c.basePath}` : '';
        return `  ${c.name} (${c.entryCount} entries)${entryPage}`;
      });

      return {
        content: [
          {
            type: 'text' as const,
            text: `Collections (${result.collections.length}):\n${lines.join('\n')}`,
          },
        ],
      };
    }
  );

  server.tool(
    'stackwright_create_collection',
    'Create a new collection directory with _collection.yaml config and a sample entry. Use --entry-page to enable automatic page generation for each entry.',
    {
      projectRoot: z
        .string()
        .refine((p) => path.isAbsolute(p), 'projectRoot must be an absolute path')
        .describe('Absolute path to the root of the Stackwright project'),
      name: z
        .string()
        .regex(
          /^[a-zA-Z0-9][a-zA-Z0-9_-]*$/,
          'Collection name must start with alphanumeric and contain only alphanumeric, hyphens, or underscores'
        )
        .describe('Collection name (e.g., "posts", "docs", "products")'),
      entryPage: z
        .boolean()
        .optional()
        .describe(
          'Enable entry page generation. When true, each entry generates a page at basePath/slug'
        ),
      basePath: z
        .string()
        .optional()
        .describe(
          'URL base path for entry pages (default: /<name>/). Only used when entryPage is true'
        ),
      sort: z
        .string()
        .optional()
        .describe('Default sort field. Prefix with - for descending (e.g., "-date")'),
      bodyField: z
        .string()
        .optional()
        .describe('Field name for entry body content (default: "body")'),
    },
    async ({ projectRoot, name, entryPage, basePath, sort, bodyField }) => {
      try {
        const result = addCollection(resolveContentDir(projectRoot), name, {
          entryPage,
          basePath,
          sort,
          bodyField,
        });

        const lines = [
          `Created collection "${result.name}" at ${result.path}`,
          `  Config: ${result.configPath}`,
          `  Sample entry: ${result.sampleEntryPath}`,
        ];
        if (result.entryPage) {
          lines.push('', 'Entry page generation is enabled. Run prebuild to generate pages.');
        }

        return { content: [{ type: 'text' as const, text: lines.join('\n') }] };
      } catch (err) {
        const code = (err as NodeJS.ErrnoException).code;
        return {
          content: [
            {
              type: 'text' as const,
              text:
                code === 'COLLECTION_EXISTS'
                  ? `Collection "${name}" already exists. Use stackwright_list_collections to see existing collections.`
                  : code === 'INVALID_NAME'
                    ? `Invalid collection name "${name}". Use only alphanumeric characters, hyphens, and underscores.`
                    : `Error creating collection: ${(err as Error).message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );
}
