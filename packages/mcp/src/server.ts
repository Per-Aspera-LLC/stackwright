import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { registerContentTypeTools } from './tools/content-types.js';
import { registerPageTools } from './tools/pages.js';
import { registerSiteTools } from './tools/site.js';
import { registerProjectTools } from './tools/project.js';
import { registerGitOpsTools } from './tools/git-ops.js';
import { registerBoardTools } from './tools/board.js';
import { registerCollectionTools } from './tools/collections.js';
import { registerComposeTools } from './tools/compose.js';
import { registerRenderTools, closeBrowser } from './tools/render.js';
import { version } from '../package.json';

const server = new McpServer({
  name: 'stackwright',
  version,
});

registerContentTypeTools(server);
registerPageTools(server);
registerSiteTools(server);
registerProjectTools(server);
registerGitOpsTools(server);
registerBoardTools(server);
registerCollectionTools(server);
registerComposeTools(server);
registerRenderTools(server);

// Clean up Playwright browser on exit
process.on('SIGINT', async () => {
  await closeBrowser();
  process.exit(0);
});
process.on('SIGTERM', async () => {
  await closeBrowser();
  process.exit(0);
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Stackwright MCP server running on stdio');
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
