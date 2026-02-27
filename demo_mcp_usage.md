# Stackwright MCP Server Usage Demo

This document demonstrates how to use the Stackwright MCP server with actual MCP clients.

## Prerequisites

1. Node.js v18+ installed
2. Stackwright monorepo cloned and built
3. `@modelcontextprotocol/sdk` installed (comes with `@stackwright/mcp`)

## Running the MCP Server

```bash
# From the monorepo root
pnpm stackwright-mcp
```

The server will start and listen on stdin/stdout for MCP protocol messages.

## Example 1: Basic Tool Usage

Here's how to connect to the MCP server and call tools programmatically:

```typescript
import { McpClient } from '@modelcontextprotocol/sdk/client/mcp.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

async function demoMcpUsage() {
  console.log('🚀 Starting Stackwright MCP demo...\n');
  
  // Create MCP client
  const client = new McpClient();
  const transport = new StdioClientTransport();
  
  try {
    // Connect to the server
    await client.connect(transport);
    console.log('✅ Connected to MCP server\n');
    
    // Example 1: Get available content types
    console.log('📋 Getting content types...');
    const contentTypes = await client.callTool('stackwright_get_content_types', {});
    console.log('Available content types:');
    console.log(contentTypes.content[0].text);
    
    // Example 2: List available themes
    console.log('\n🎨 Listing themes...');
    const themes = await client.callTool('stackwright_list_themes', {});
    console.log('Available themes:');
    console.log(themes.content[0].text);
    
    // Example 3: Get project info (if in a Stackwright project)
    const projectPath = process.cwd();
    console.log(`\n📁 Getting project info for: ${projectPath}`);
    try {
      const projectInfo = await client.callTool('stackwright_get_project_info', {
        projectRoot: projectPath
      });
      console.log('Project information:');
      console.log(projectInfo.content[0].text);
    } catch (error) {
      console.log('Not in a Stackwright project, or project info unavailable');
    }
    
  } catch (error) {
    console.error('❌ MCP demo failed:', error);
  } finally {
    // Clean up
    await client.disconnect();
    console.log('\n✅ Demo completed');
  }
}

demoMcpUsage().catch(console.error);
```

## Example 2: Creating a New Page

This example shows how to add a new page to a Stackwright project:

```typescript
import { McpClient } from '@modelcontextprotocol/sdk/client/mcp.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

async function createNewPage() {
  const client = new McpClient();
  const transport = new StdioClientTransport();
  
  try {
    await client.connect(transport);
    
    const projectRoot = '/path/to/your/stackwright-project';
    
    // Create a new "About" page
    const result = await client.callTool('stackwright_add_page', {
      projectRoot: projectRoot,
      slug: 'about',
      heading: 'About Our Company'
    });
    
    console.log('✅ Page created:', result.content[0].text);
    
    // Validate the new page
    const validation = await client.callTool('stackwright_validate_pages', {
      projectRoot: projectRoot,
      slug: 'about'
    });
    
    console.log('🔍 Validation result:', validation.content[0].text);
    
  } catch (error) {
    console.error('❌ Failed to create page:', error);
  } finally {
    await client.disconnect();
  }
}

createNewPage().catch(console.error);
```

## Example 3: Project Scaffold

This example demonstrates how to scaffold a new Stackwright project:

```typescript
import { McpClient } from '@modelcontextprotocol/sdk/client/mcp.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

async function scaffoldNewProject() {
  const client = new McpClient();
  const transport = new StdioClientTransport();
  
  try {
    await client.connect(transport);
    
    // First, list available themes to choose from
    const themesResult = await client.callTool('stackwright_list_themes', {});
    console.log('Available themes:');
    console.log(themesResult.content[0].text);
    
    // Scaffold a new project
    const result = await client.callTool('stackwright_scaffold_project', {
      targetDir: '/path/to/new-project',
      name: 'my-awesome-site',
      title: 'My Awesome Site',
      theme: 'per-aspera' // Use one of the available themes
    });
    
    console.log('✅ Project scaffolded:');
    console.log(result.content[0].text);
    
  } catch (error) {
    console.error('❌ Failed to scaffold project:', error);
  } finally {
    await client.disconnect();
  }
}

scaffoldNewProject().catch(console.error);
```

## Example 4: Content Validation Workflow

This example shows a complete content validation workflow:

```typescript
import { McpClient } from '@modelcontextprotocol/sdk/client/mcp.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

async function validateProjectContent() {
  const client = new McpClient();
  const transport = new StdioClientTransport();
  
  try {
    await client.connect(transport);
    
    const projectRoot = '/path/to/your/stackwright-project';
    
    // 1. Validate site configuration
    console.log('🔍 Validating site configuration...');
    const siteValidation = await client.callTool('stackwright_validate_site', {
      projectRoot: projectRoot
    });
    console.log(siteValidation.content[0].text);
    
    // 2. List all pages
    console.log('\n📄 Listing all pages...');
    const pages = await client.callTool('stackwright_list_pages', {
      projectRoot: projectRoot
    });
    console.log(pages.content[0].text);
    
    // 3. Validate all pages
    console.log('\n🔍 Validating all pages...');
    const pageValidation = await client.callTool('stackwright_validate_pages', {
      projectRoot: projectRoot
    });
    console.log(pageValidation.content[0].text);
    
    if (pageValidation.isError) {
      console.log('❌ Validation failed! Check the errors above.');
    } else {
      console.log('✅ All content is valid!');
    }
    
  } catch (error) {
    console.error('❌ Validation workflow failed:', error);
  } finally {
    await client.disconnect();
  }
}

validateProjectContent().catch(console.error);
```

## Integration with AI Agents

The MCP server is designed to work seamlessly with AI agents like Claude Code. Here's how an AI agent might use these tools:

### Agent Workflow Example

1. **Agent receives request**: "Create a new about page for my Stackwright site"
2. **Agent calls tools**:
   - `stackwright_get_content_types` - to understand available content types
   - `stackwright_list_pages` - to see existing pages
   - `stackwright_add_page` - to create the new about page
   - `stackwright_validate_pages` - to ensure the page is valid
3. **Agent provides feedback**: "Created about page successfully. Validation passed."

### Example Agent Tool Sequence

```typescript
// Agent workflow for creating content
async function agentCreateContentPage() {
  const client = new McpClient();
  await client.connect(new StdioClientTransport());
  
  try {
    // 1. Get available content types to understand schema
    const contentTypes = await client.callTool('stackwright_get_content_types', {});
    
    // 2. Create a new page with appropriate content structure
    const newPage = await client.callTool('stackwright_add_page', {
      projectRoot: '/project/path',
      slug: 'services',
      heading: 'Our Services'
    });
    
    // 3. Validate the new content
    const validation = await client.callTool('stackwright_validate_pages', {
      projectRoot: '/project/path',
      slug: 'services'
    });
    
    // 4. Return success/failure to user
    return validation.isError 
      ? 'Failed to create page: ' + validation.content[0].text
      : 'Successfully created services page!';
      
  } finally {
    await client.disconnect();
  }
}
```

## Error Handling

The MCP server provides structured error responses:

```typescript
try {
  const result = await client.callTool('stackwright_validate_pages', {
    projectRoot: '/invalid/path'
  });
  
  if (result.isError) {
    console.error('Validation errors:', result.content[0].text);
    // Handle specific errors
    if (result.content[0].text.includes('Missing required field')) {
      // Provide guidance on missing fields
    }
  }
} catch (error) {
  console.error('Tool call failed:', error.message);
}
```

## Best Practices

1. **Always validate**: Call validation tools after creating/modifying content
2. **Check tool availability**: Use `stackwright_get_content_types` to understand available schemas
3. **Handle errors gracefully**: Check `isError` flag in responses
4. **Clean up connections**: Always call `client.disconnect()` in finally blocks
5. **Use absolute paths**: All file paths should be absolute for reliability

## Troubleshooting

### Common Issues

**Server not responding**:
- Ensure the server is running with `pnpm stackwright-mcp`
- Check that stdin/stdout are properly connected

**Tool not found**:
- Verify the tool name is correct (check documentation)
- Ensure the server has all tools registered

**Permission errors**:
- Use absolute paths that the server process can access
- Ensure the server has write permissions for file operations

**Validation failures**:
- Check the error messages for specific field issues
- Use `stackwright_get_content_types` to see required fields

## Running Tests

To verify the MCP server is working correctly:

```bash
cd packages/mcp
pnpm test
```

This runs the comprehensive test suite that validates all tools and their integration.