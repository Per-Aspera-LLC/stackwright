# Stackwright MCP Server

The `@stackwright/mcp` package provides an MCP (Model Context Protocol) server that exposes Stackwright's content types, page management, and validation as agent tools. This enables AI agents and other MCP-compatible clients to programmatically interact with Stackwright projects.

## Overview

The MCP server runs as a stdio-based service and provides tools for:

- **Content Type Introspection**: Discover available content types and their schemas
- **Page Management**: List, add, and validate pages in a Stackwright project
- **Site Management**: Read, write, and validate site configuration; list available themes
- **Project Management**: Get project information and scaffold new projects
- **Git Operations**: Stage content changes and open pull requests for review
- **Visual Rendering**: Screenshot pages, capture before/after diffs, verify brand consistency

## Prerequisites

- Node.js v18+
- Stackwright monorepo cloned and built (`pnpm install && pnpm build` from root)

## Running the Server

```bash
# From the monorepo root
pnpm stackwright-mcp
```

The server starts and listens on stdin/stdout for MCP protocol messages.

## Available Tools

### Content Type Tools

#### `stackwright_get_content_types`

List all available Stackwright content types with their fields.

**Parameters**: None

**Returns**: Text listing of all content types and sub-types with their fields

**Example Usage**:
```typescript
const result = await server.callTool('stackwright_get_content_types', {});
// Returns: CONTENT TYPES (use as keys inside content_items[]):
//   main (main)
//     label: string
//     heading: TextBlock
//     textBlocks: TextBlock[]
//     media?: MediaItem
//     ...
```

### Page Tools

#### `stackwright_list_pages`

List all pages in a Stackwright project.

**Parameters**:
- `projectRoot` (string): Absolute path to the root of the Stackwright project

**Returns**: Text listing of pages with slugs and headings

**Example Usage**:
```typescript
const result = await server.callTool('stackwright_list_pages', {
  projectRoot: '/path/to/project'
});
// Returns: Pages (3):
//   about  —  About Us
//   contact  —  Contact
//   team/leadership
```

#### `stackwright_add_page`

Create a new page in a Stackwright project.

**Parameters**:
- `projectRoot` (string): Absolute path to the root of the Stackwright project
- `slug` (string): Page slug (e.g., "about" or "team/leadership")
- `heading` (string, optional): Optional heading for the new page

**Returns**: Text confirmation with created page path

**Example Usage**:
```typescript
const result = await server.callTool('stackwright_add_page', {
  projectRoot: '/path/to/project',
  slug: 'about',
  heading: 'About Us'
});
// Returns: Created page "about" at /path/to/project/content/pages/about/content.yml
```

#### `stackwright_validate_pages`

Validate page YAML files against the Stackwright content schema.

**Parameters**:
- `projectRoot` (string): Absolute path to the root of the Stackwright project
- `slug` (string, optional): Validate only this slug; omit to validate all pages

**Returns**: Text validation result or error messages

**Example Usage**:
```typescript
const result = await server.callTool('stackwright_validate_pages', {
  projectRoot: '/path/to/project'
});
// Returns: ✓ Validation passed for all pages.
// Or: Validation failed:
//   [about] Missing required field: heading
```

### Site Tools

#### `stackwright_validate_site`

Validate the stackwright.yml site configuration file.

**Parameters**:
- `projectRoot` (string): Absolute path to the root of the Stackwright project

**Returns**: Text validation result or error messages

**Example Usage**:
```typescript
const result = await server.callTool('stackwright_validate_site', {
  projectRoot: '/path/to/project'
});
// Returns: ✓ Site config is valid (/path/to/project/stackwright.yml).
```

#### `stackwright_get_site_config`

Read the raw YAML content of the stackwright.yml site configuration file.

**Parameters**:
- `projectRoot` (string): Absolute path to the root of the Stackwright project

**Returns**: Text with the full YAML content of the site configuration

#### `stackwright_write_site_config`

Write or update the stackwright.yml site configuration. Validates against the site config Zod schema before writing — invalid YAML is rejected with field-level errors.

**Parameters**:
- `projectRoot` (string): Absolute path to the root of the Stackwright project
- `content` (string): The full YAML content for the site config

**Returns**: Text confirmation of creation or update, or validation error details

**Example Usage**:
```typescript
const result = await server.callTool('stackwright_write_site_config', {
  projectRoot: '/path/to/project',
  content: `title: "My Site"
navigation:
  - label: "Home"
    href: "/"
appBar:
  titleText: "My Site"
footer:
  copyright: "© 2026"
`
});
// Returns: Updated site config at /path/to/project/stackwright.yml
```

#### `stackwright_list_themes`

List all built-in Stackwright themes.

**Parameters**: None

**Returns**: Text listing of themes with IDs, names, and descriptions

**Example Usage**:
```typescript
const result = await server.callTool('stackwright_list_themes', {});
// Returns: Built-in themes (3):
//   default  —  Default Theme
//   dark  —  Dark Theme: Dark mode theme
//   light  —  Light Theme: Light mode theme
```

### Project Tools

#### `stackwright_get_project_info`

Get information about a Stackwright project.

**Parameters**:
- `projectRoot` (string): Absolute path to the root of the Stackwright project

**Returns**: Text with project info including package versions, theme, and page count

**Example Usage**:
```typescript
const result = await server.callTool('stackwright_get_project_info', {
  projectRoot: '/path/to/project'
});
// Returns: Project root: /path/to/project
//           Site title:   My Site
//           Active theme: default
//           Pages:        5
//           Packages:
//             @stackwright/core: 0.1.0-alpha.0
//             @stackwright/nextjs: 0.1.0-alpha.0
```

#### `stackwright_scaffold_project`

Scaffold a new Stackwright Next.js project.

**Parameters**:
- `targetDir` (string): Absolute path where the new project should be created
- `name` (string, optional): npm package name for the new project
- `title` (string, optional): Site title
- `theme` (string, optional): Theme ID to use

**Returns**: Text confirmation with scaffolded project details

**Example Usage**:
```typescript
const result = await server.callTool('stackwright_scaffold_project', {
  targetDir: '/path/to/new-project',
  name: 'my-stackwright-site',
  title: 'My Site',
  theme: 'default'
});
// Returns: Scaffolded project at: /path/to/new-project
//           Theme: default
//           Sample pages: about, contact, home
```

### Git Operations Tools

#### `stackwright_stage_changes`

Stage modified or new Stackwright content files (page YAML, site config, co-located images) for commit. Only content files are staged — arbitrary files like `.env` or `package.json` are ignored for safety.

**Parameters**:
- `projectRoot` (string): Absolute path to the root of the Stackwright project
- `paths` (string[], optional): Specific relative paths to stage (still filtered to allowed content paths)

**Returns**: Text listing of staged and skipped files

**Allowed file patterns** (relative to project root):
- `pages/**/*.{yml,yaml}` and `content/pages/**/*.{yml,yaml}` — page content
- `pages/**/*.{png,jpg,jpeg,gif,svg,webp}` and `content/pages/**/*.{png,jpg,jpeg,gif,svg,webp}` — co-located images
- `stackwright.{yml,yaml}` — site configuration

**Example Usage**:
```typescript
const result = await server.callTool('stackwright_stage_changes', {
  projectRoot: '/path/to/project'
});
// Returns: Staged 2 file(s):
//   + pages/about/content.yml
//   + stackwright.yml
//
// Skipped 1 non-content file(s):
//   - package.json
```

#### `stackwright_open_pr`

Validate all staged YAML, commit changes, push to a new branch, and open a GitHub pull request. Requires the GitHub CLI (`gh`) to be installed and authenticated. Aborts if validation fails — invalid YAML is never committed.

**Parameters**:
- `projectRoot` (string): Absolute path to the root of the Stackwright project
- `title` (string, optional): PR title (auto-generated from file list if omitted)
- `description` (string, optional): PR body/description (auto-generated summary if omitted)
- `branchName` (string, optional): Custom branch name (default: `content/agent-<timestamp>`)
- `baseBranch` (string, optional): Target branch for the PR (default: repo default branch)
- `draft` (boolean, optional): Open as a draft PR (default: false)

**Returns**: Text with PR URL, branch name, commit hash, and list of committed files

**Prerequisites**:
- Git repository initialized with a remote named `origin`
- [GitHub CLI](https://cli.github.com/) installed and authenticated (`gh auth login`)
- Content changes staged via `stackwright_stage_changes`

**Example Usage**:
```typescript
const result = await server.callTool('stackwright_open_pr', {
  projectRoot: '/path/to/project',
  title: 'Add services page',
  baseBranch: 'dev'
});
// Returns: Pull request opened: https://github.com/org/repo/pull/42
//           Branch: content/agent-20260306-143022
//           Commit: a1b2c3d4
//           Files committed (1):
//             pages/services/content.yml
```

### Visual Rendering Tools

#### `stackwright_check_dev_server`

Check if a Stackwright dev server is running and reachable. Call this before using render tools.

**Parameters**:
- `baseUrl` (string, optional): Base URL to check (default: http://localhost:3000)

**Returns**: Text confirming server is reachable, or error with instructions to start the dev server

**Example Usage**:
```typescript
const result = await server.callTool('stackwright_check_dev_server', {});
// Returns: ✓ Dev server is running at http://localhost:3000. You can now use stackwright_render_page to see your pages.
```

#### `stackwright_render_page`

Render a Stackwright page and return a screenshot image. Use this to visually verify how a page looks after writing or editing content. Requires a running dev server.

**Parameters**:
- `baseUrl` (string, optional): Base URL of the running dev server (default: http://localhost:3000)
- `slug` (string): Page slug to render (e.g., "/" for home, "/about", "/pricing")
- `viewport` (object, optional): `{ width: number, height: number }` — viewport size (default: 1280x720). Use 375x667 for mobile.
- `fullPage` (boolean, optional): Capture full scrollable page or just the viewport (default: true)
- `format` (string, optional): Image format — "png" or "jpeg" (default: "png")

**Returns**: Text with render metadata plus a PNG/JPEG screenshot image

**Example Usage**:
```typescript
const result = await server.callTool('stackwright_render_page', {
  slug: '/about',
  viewport: { width: 375, height: 667 }
});
// Returns: Rendered "/about" (375x667, 1234ms):
// [image: screenshot of the rendered page]
```

#### `stackwright_render_diff`

Capture a "before" screenshot of a page for visual comparison. After capturing, make your YAML changes and call `stackwright_render_page` to see the "after" state.

**Parameters**:
- `baseUrl` (string, optional): Base URL of the running dev server (default: http://localhost:3000)
- `slug` (string): Page slug to snapshot
- `viewport` (object, optional): `{ width: number, height: number }` — viewport size
- `fullPage` (boolean, optional): Capture full scrollable page (default: true)

**Returns**: Text with snapshot metadata plus a "before" PNG screenshot

**Workflow**:
1. Call `stackwright_render_diff` to capture the current state
2. Write your YAML changes (`stackwright_write_page` or `stackwright_compose_site`)
3. Wait for the dev server to hot-reload
4. Call `stackwright_render_page` to see the "after" state
5. Compare the two images to evaluate your changes

**Example Usage**:
```typescript
const result = await server.callTool('stackwright_render_diff', {
  slug: '/pricing'
});
// Returns: 📸 "Before" snapshot captured for "/pricing" (1280x720, 987ms).
// [image: screenshot of the current page state]
```

## Integration with MCP Clients

The Stackwright MCP server follows the Model Context Protocol (MCP) specification. Any MCP-compatible client can connect to and use these tools.

### Example: Full editorial loop (content authoring → PR)

```typescript
import { McpClient } from '@modelcontextprotocol/sdk/client/mcp.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const client = new McpClient();
await client.connect(new StdioClientTransport());

try {
  const projectRoot = '/path/to/project';

  // 1. Understand available content types
  const contentTypes = await client.callTool('stackwright_get_content_types', {});

  // 2. Create a new page
  await client.callTool('stackwright_add_page', {
    projectRoot,
    slug: 'services',
    heading: 'Our Services',
  });

  // 3. Validate
  const validation = await client.callTool('stackwright_validate_pages', {
    projectRoot,
    slug: 'services',
  });

  if (validation.isError) {
    console.error('Validation failed:', validation.content[0].text);
    return;
  }

  // 4. Stage content changes (only content files are staged)
  const staged = await client.callTool('stackwright_stage_changes', { projectRoot });
  console.log(staged.content[0].text);

  // 5. Open a PR for human review
  const pr = await client.callTool('stackwright_open_pr', {
    projectRoot,
    title: 'Add services page',
    baseBranch: 'dev',
  });
  console.log(pr.content[0].text); // PR URL
} finally {
  await client.disconnect();
}
```

## Best Practices

1. **Always validate after creating or modifying content** — call `stackwright_validate_pages` after `stackwright_add_page`.
2. **Use `stackwright_get_content_types` to ground your YAML** — the tool returns the live Zod-derived schema, so field names and required/optional status are always current.
3. **Check `isError` on every response** — tools signal errors via the `isError` flag rather than throwing, so a successful HTTP-level call can still represent a domain error.
4. **Use absolute paths** — all `projectRoot` and `targetDir` parameters must be absolute paths.
5. **Disconnect in a finally block** — always call `client.disconnect()` to avoid leaving the server process orphaned.
6. **Render after editing** — call `stackwright_render_page` after making content changes to visually verify the result. This catches layout, spacing, and brand consistency issues that schema validation alone cannot detect.
7. **Check the dev server first** — always call `stackwright_check_dev_server` before any render tool. If the server isn't running, render tools will fail with a clear error.

## Development

### Building

```bash
cd packages/mcp
pnpm build
```

### Testing

```bash
cd packages/mcp
pnpm test
```

### Running in Development Mode

```bash
cd packages/mcp
pnpm dev
```

## Architecture

The MCP server is built on top of the `@modelcontextprotocol/sdk` and exposes functionality from the `@stackwright/cli` package as MCP tools. Each tool corresponds to a CLI command but is adapted for programmatic use.

### Tool Registration Pattern

```typescript
server.tool(
  'tool_name',
  'Tool description',
  {
    param1: z.string().describe('Description'),
    param2: z.number().optional().describe('Optional description'),
  },
  async ({ param1, param2 }) => {
    return { content: [{ type: 'text', text: 'Result' }] };
  }
);
```

## Error Handling

Tools return structured responses with:
- `content`: Array of content items (text, images, etc.)
- `isError`: Boolean flag indicating if the response represents an error

```json
{
  "content": [{ "type": "text", "text": "Validation failed:\n  [about] Missing required field: heading" }],
  "isError": true
}
```

## Troubleshooting

**Server not responding** — ensure the server is running with `pnpm stackwright-mcp` and that stdin/stdout are properly connected to the client.

**Tool not found** — verify the tool name is correct (all tool names are prefixed with `stackwright_`).

**Validation failures** — check the structured error text for specific field issues; use `stackwright_get_content_types` to confirm required fields.

**Permission errors on file operations** — use absolute paths and ensure the server process has write access to the target directory.

## Version Compatibility

- `@modelcontextprotocol/sdk`: ^1.27.0
- `@stackwright/cli`: Same workspace version
- Node.js: ^18.0.0 or later

## License

MIT License. See the [LICENSE](../LICENSE) file for details.

## Support

- GitHub Issues: https://github.com/Per-Aspera-LLC/stackwright/issues
