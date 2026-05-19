import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import path from 'path';
import fs from 'fs';
import { listIntegrations, getIntegration, addIntegration } from '@stackwright/cli';

function resolveSiteConfig(projectRoot: string): string {
  const candidates = ['stackwright.yml', 'stackwright.yaml'];
  for (const name of candidates) {
    const p = path.join(projectRoot, name);
    if (fs.existsSync(p)) return p;
  }
  return path.join(projectRoot, 'stackwright.yml');
}

export function registerIntegrationTools(server: McpServer): void {
  server.tool(
    'stackwright_list_integrations',
    'List all integrations configured in stackwright.yml (OpenAPI, GraphQL, REST).',
    {
      projectRoot: z.string().describe('Absolute path to the root of the Stackwright project'),
    },
    async ({ projectRoot }) => {
      try {
        const siteConfigPath = resolveSiteConfig(projectRoot);
        const result = listIntegrations(siteConfigPath);
        if (result.integrations.length === 0) {
          return { content: [{ type: 'text', text: 'No integrations configured.' }] };
        }
        const lines = result.integrations.map((i) => {
          const specPart = i.spec ? ` — spec: ${String(i.spec)}` : '';
          const endpointPart = i.endpoint ? ` — endpoint: ${String(i.endpoint)}` : '';
          return `  ${i.name} [${i.type}]${specPart}${endpointPart}`;
        });
        return {
          content: [
            {
              type: 'text',
              text: `Integrations (${result.integrations.length}):\n${lines.join('\n')}`,
            },
          ],
        };
      } catch (err) {
        return {
          content: [{ type: 'text', text: `Error: ${(err as Error).message}` }],
          isError: true,
        };
      }
    }
  );

  server.tool(
    'stackwright_get_integration',
    'Get details for a specific integration by name from stackwright.yml.',
    {
      projectRoot: z.string().describe('Absolute path to the root of the Stackwright project'),
      name: z.string().describe('The integration name (e.g. "logistics", "inventory")'),
    },
    async ({ projectRoot, name }) => {
      try {
        const siteConfigPath = resolveSiteConfig(projectRoot);
        const result = getIntegration(siteConfigPath, name);
        if (!result.integration) {
          return {
            content: [{ type: 'text', text: `Integration "${name}" not found.` }],
            isError: true,
          };
        }
        return {
          content: [{ type: 'text', text: JSON.stringify(result.integration, null, 2) }],
        };
      } catch (err) {
        return {
          content: [{ type: 'text', text: `Error: ${(err as Error).message}` }],
          isError: true,
        };
      }
    }
  );

  server.tool(
    'stackwright_add_integration',
    'Add or update an integration in stackwright.yml. Supports OpenAPI, GraphQL, and REST integrations.',
    {
      projectRoot: z.string().describe('Absolute path to the root of the Stackwright project'),
      name: z
        .string()
        .min(1)
        .max(50)
        .regex(/^[a-z0-9][a-z0-9-]*[a-z0-9]$/, 'Name must be kebab-case')
        .describe('Unique integration name (kebab-case, e.g. "logistics-api")'),
      type: z.enum(['openapi', 'graphql', 'rest']).describe('Integration type'),
      spec: z.string().optional().describe('Path to OpenAPI spec file (for openapi type)'),
      endpoint: z.string().optional().describe('API endpoint URL (for graphql/rest type)'),
    },
    async ({ projectRoot, name, type, spec, endpoint }) => {
      try {
        const siteConfigPath = resolveSiteConfig(projectRoot);
        const entry = {
          type,
          name,
          ...(spec ? { spec } : {}),
          ...(endpoint ? { endpoint } : {}),
        };
        const result = addIntegration(siteConfigPath, entry);
        const verb = result.updated ? 'Updated' : 'Added';
        return {
          content: [
            { type: 'text', text: `✓ ${verb} integration "${name}" [${type}] in ${result.path}` },
          ],
        };
      } catch (err) {
        return {
          content: [{ type: 'text', text: `Error: ${(err as Error).message}` }],
          isError: true,
        };
      }
    }
  );
}
