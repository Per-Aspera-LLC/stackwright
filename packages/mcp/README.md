# Stackwright MCP Server

The `@stackwright/mcp` package provides an MCP (Model Context Protocol) server that exposes Stackwright's content types, page management, and validation as agent tools. This enables AI agents and other MCP-compatible clients to programmatically interact with Stackwright projects.

## Overview

The MCP server runs as a stdio-based service and provides tools for:

- **Content Type Introspection**: Discover available content types and their schemas
- **Page Management**: List, add, and validate pages in a Stackwright project
- **Site Management**: Validate site configuration and list available themes
- **Project Management**: Get project information and scaffold new projects

## Installation

```bash
# Install the MCP server package
pnpm add @stackwright/mcp

# Or build from source
cd packages/mcp
pnpm build
```

## Running the Server

```bash
# Run the MCP server (stdio mode)
pnpm stackwright-mcp
```

The server will start and listen on stdin/stdout for MCP protocol messages.

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

## Integration with MCP Clients

The Stackwright MCP server follows the Model Context Protocol (MCP) specification. Any MCP-compatible client can connect to and use these tools.

### Example: Using with Claude Code

```typescript
// Connect to the MCP server
const client = new McpClient();
await client.connect(new StdioClientTransport());

// Call a tool
const result = await client.callTool('stackwright_get_content_types', {});
console.log(result.content[0].text);

// Disconnect when done
await client.disconnect();
```

### Example: Using with Custom MCP Client

```typescript
import { McpClient } from '@modelcontextprotocol/sdk/client/mcp.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

async function main() {
  const client = new McpClient();
  const transport = new StdioClientTransport();
  
  await client.connect(transport);
  
  try {
    // Get content types
    const contentTypes = await client.callTool('stackwright_get_content_types', {});
    console.log('Content types:', contentTypes.content[0].text);
    
    // List pages in a project
    const pages = await client.callTool('stackwright_list_pages', {
      projectRoot: '/path/to/project'
    });
    console.log('Pages:', pages.content[0].text);
    
  } finally {
    await client.disconnect();
  }
}

main().catch(console.error);
```

## Development

### Building

```bash
# Build the MCP server
pnpm build:mcp

# Or from the monorepo root
cd packages/mcp
pnpm build
```

### Testing

```bash
# Run tests
pnpm test:mcp

# Or from the monorepo root
cd packages/mcp
pnpm test
```

### Running in Development Mode

```bash
# Watch for changes and rebuild
pnpm dev:mcp

# Or from the monorepo root
cd packages/mcp
pnpm dev
```

## Architecture

The MCP server is built on top of the `@modelcontextprotocol/sdk` and exposes functionality from the `@stackwright/cli` package as MCP tools. Each tool corresponds to a CLI command but is adapted for programmatic use.

### Tool Registration Pattern

```typescript
// Each tool is registered with:
// - A unique name (e.g., 'stackwright_get_content_types')
// - A description for agents
// - Input schema (using Zod for validation)
// - An async handler function

server.tool(
  'tool_name',
  'Tool description',
  {
    // Input parameters with Zod validation
    param1: z.string().describe('Description'),
    param2: z.number().optional().describe('Optional description')
  },
  async ({ param1, param2 }) => {
    // Tool implementation
    return { content: [{ type: 'text', text: 'Result' }] };
  }
);
```

## Error Handling

Tools return structured responses with:
- `content`: Array of content items (text, images, etc.)
- `isError`: Boolean flag indicating if the response represents an error

Example error response:
```json
{
  "content": [
    {
      "type": "text",
      "text": "Validation failed:\n  [about] Missing required field: heading"
    }
  ],
  "isError": true
}
```

## Version Compatibility

The MCP server is designed to work with:
- `@modelcontextprotocol/sdk`: ^1.27.0
- `@stackwright/cli`: Same workspace version
- Node.js: ^18.0.0 or later

## License

MIT License. See the [LICENSE](../LICENSE) file for details.

## Support

For issues and questions:
- GitHub Issues: https://github.com/Per-Aspera-LLC/stackwright/issues
- Documentation: https://github.com/Per-Aspera-LLC/stackwright
- MCP Protocol: https://modelcontextprotocol.org/

## Future Roadmap

- Additional tools for theme management
- Tools for component registration and customization
- Support for more complex content operations
- Integration with build and deployment pipelines