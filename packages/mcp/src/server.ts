import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { registerContentTypeTools } from './tools/content-types.js';
import { registerPageTools } from './tools/pages.js';
import { registerSiteTools } from './tools/site.js';
import { registerProjectTools } from './tools/project.js';

const server = new McpServer({
  name: 'stackwright',
  version: '0.1.0-alpha.0',
});

registerContentTypeTools(server);
registerPageTools(server);
registerSiteTools(server);
registerProjectTools(server);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Stackwright MCP server running on stdio');
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
