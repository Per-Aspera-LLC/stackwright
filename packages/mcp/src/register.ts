/**
 * Public API for composing Stackwright MCP tools onto a downstream MCP server.
 * All registrars take an McpServer instance and register their tools onto it.
 * No side effects — safe to import without spinning up a transport or process.
 */

export { registerContentTypeTools } from './tools/content-types.js';
export { registerPageTools } from './tools/pages.js';
export { registerSiteTools } from './tools/site.js';
export { registerProjectTools } from './tools/project.js';
export { registerGitOpsTools } from './tools/git-ops.js';
export { registerBoardTools } from './tools/board.js';
export { registerCollectionTools } from './tools/collections.js';
export { registerIntegrationTools } from './tools/integrations.js';
export { registerComposeTools } from './tools/compose.js';
export { registerRenderTools, closeBrowser } from './tools/render.js';
export { registerA11yTools } from './tools/a11y.js';
