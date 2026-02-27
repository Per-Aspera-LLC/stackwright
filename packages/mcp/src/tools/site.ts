import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import path from 'path';
import fs from 'fs';
import { validateSite, listThemes } from '@stackwright/cli';

function resolveSiteConfig(projectRoot: string): string {
  const candidates = ['stackwright.yml', 'stackwright.yaml'];
  for (const name of candidates) {
    const p = path.join(projectRoot, name);
    if (fs.existsSync(p)) return p;
  }
  return path.join(projectRoot, 'stackwright.yml');
}

export function registerSiteTools(server: McpServer): void {
  server.tool(
    'stackwright_validate_site',
    'Validate the stackwright.yml site configuration file against the Stackwright site config schema.',
    {
      projectRoot: z.string().describe('Absolute path to the root of the Stackwright project'),
    },
    async ({ projectRoot }) => {
      const siteConfigPath = resolveSiteConfig(projectRoot);
      const result = validateSite(siteConfigPath);
      if (result.valid) {
        return { content: [{ type: 'text', text: `✓ Site config is valid (${siteConfigPath}).` }] };
      }
      const errorLines = result.errors.map((e) => `  [${e.field}] ${e.message}`);
      return {
        content: [
          {
            type: 'text',
            text: `Site config validation failed (${siteConfigPath}):\n${errorLines.join('\n')}`,
          },
        ],
        isError: true,
      };
    }
  );

  server.tool(
    'stackwright_list_themes',
    'List all built-in Stackwright themes with their IDs, names, and descriptions.',
    {},
    async () => {
      const result = listThemes();
      const lines = result.themes.map(
        (t) => `  ${t.id}  —  ${t.name}${t.description ? `: ${t.description}` : ''}`
      );
      const text =
        result.themes.length === 0
          ? 'No built-in themes found.'
          : `Built-in themes (${result.themes.length}):\n${lines.join('\n')}`;
      return { content: [{ type: 'text', text }] };
    }
  );
}
