import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  registerContentTypeTools,
  registerPageTools,
  registerSiteTools,
  registerProjectTools,
  registerGitOpsTools,
  registerBoardTools,
  registerCollectionTools,
  registerIntegrationTools,
  registerComposeTools,
  registerRenderTools,
  registerA11yTools,
  closeBrowser,
} from './register.js';
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
registerIntegrationTools(server);
registerComposeTools(server);
registerRenderTools(server);
registerA11yTools(server);

// Clean up Playwright browser on exit
process.on('SIGINT', async () => {
  const forceExit = setTimeout(() => process.exit(1), 3000);
  forceExit.unref();
  await closeBrowser();
  process.exit(0);
});
process.on('SIGTERM', async () => {
  const forceExit = setTimeout(() => process.exit(1), 3000);
  forceExit.unref();
  await closeBrowser();
  process.exit(0);
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Stackwright MCP server running on stdio');
}

main().catch(async (err) => {
  console.error('Fatal:', err);
  await closeBrowser();
  process.exit(1);
});
