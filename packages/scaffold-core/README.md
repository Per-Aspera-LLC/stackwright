# @stackwright/scaffold-core

Scaffold hooks system for Stackwright - enables extensible post-scaffold processing for Pro packages.

## Overview

This package provides a hook system that Pro packages use to extend scaffold functionality:
- Enterprise license injection
- Custom MCP server configuration
- Additional project setup
- Post-install verification

## Installation

```bash
pnpm add @stackwright/scaffold-core
```

**Note**: This package is typically used by `@stackwright/cli` internally. Pro packages import it to register hooks.

## Hook Lifecycle

Hooks run at these points during scaffolding:

| Hook | When | Use Case |
|------|------|----------|
| `preScaffold` | Before scaffolding begins | Validate credentials, check environment |
| `preInstall` | After files created, before install | Modify package.json, configure MCP |
| `postInstall` | After pnpm install completes | Run additional setup, verify installation |
| `postScaffold` | After scaffolding complete | Final configuration, cleanup |

## Usage

### Registering a Hook

```typescript
import { registerScaffoldHook } from '@stackwright/scaffold-core';

registerScaffoldHook({
  type: 'preInstall',
  name: 'enterprise-license',
  priority: 10,
  handler: async (ctx) => {
    ctx.packageJson.dependencies['@stackwright-pro/license'] = '^1.0.0';
  },
});
```

### Hook Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `type` | `ScaffoldHookType` | Required | Lifecycle point |
| `name` | `string` | Required | Unique hook name |
| `priority` | `number` | `50` | Lower = runs first |
| `critical` | `boolean` | `false` | If true, failure fails entire scaffold |
| `handler` | `function` | Required | Async function to execute |

### Hook Context

The context object passed to hooks:

```typescript
interface ScaffoldHookContext {
  targetDir: string;           // Project directory
  projectName: string;         // Project name
  siteTitle: string;           // Site title
  themeId: string;             // Theme ID
  packageJson: Record<string, any>;   // Mutable - add dependencies
  codePuppyConfig?: Record<string, any>; // Mutable - add MCP config
  dependencyMode: 'workspace' | 'standalone';
  pages?: string[];            // Pages being created
  install?: boolean;            // Whether install will run
  [key: string]: any;          // Hooks can add properties
}
```

## Pro Integration Example

Create `packages/pro-launch-hooks/index.ts`:

```typescript
import { registerScaffoldHook } from '@stackwright/scaffold-core';

// Add enterprise license during preInstall
registerScaffoldHook({
  type: 'preInstall',
  name: 'enterprise-license',
  priority: 10,
  critical: true,
  handler: async (ctx) => {
    if (!process.env.PRO_API_KEY) {
      throw new Error('PRO_API_KEY environment variable required');
    }
    ctx.packageJson.dependencies['@stackwright-pro/license'] = '^1.0.0';
    ctx.packageJson.dependencies['@stackwright-pro/sso'] = '^1.0.0';
  },
});

// Configure enterprise MCP server
registerScaffoldHook({
  type: 'preInstall',
  name: 'enterprise-mcp',
  priority: 20,
  handler: async (ctx) => {
    ctx.codePuppyConfig = ctx.codePuppyConfig || {};
    ctx.codePuppyConfig.mcp_servers = ctx.codePuppyConfig.mcp_servers || {};
    ctx.codePuppyConfig.mcp_servers.enterprise = {
      command: 'node',
      args: ['node_modules/@stackwright-pro/mcp/dist/server.js'],
      env: {
        API_KEY: process.env.PRO_API_KEY,
      },
    };
  },
});

// Post-install verification
registerScaffoldHook({
  type: 'postInstall',
  name: 'verify-license',
  priority: 50,
  handler: async (ctx) => {
    // Verify license is valid
    const response = await fetch('https://api.stackwright.pro/verify', {
      headers: { 'Authorization': `Bearer ${process.env.PRO_API_KEY}` }
    });
    if (!response.ok) {
      throw new Error('License verification failed');
    }
  },
});
```

In Pro package `package.json`:

```json
{
  "name": "@stackwright-pro/launch-hooks",
  "main": "index.js",
  "dependencies": {
    "@stackwright/scaffold-core": "workspace:*"
  }
}
```

## Registry Functions

```typescript
import { 
  registerScaffoldHook,     // Register a new hook
  getScaffoldHooks,         // Get all registered hooks
  getScaffoldHooksForType, // Get hooks for specific lifecycle
  clearScaffoldHooks,       // Clear all hooks (testing)
} from '@stackwright/scaffold-core';
```

## CLI Usage

The hooks run automatically when using:

```bash
# These commands trigger hook execution
npx @stackwright/cli scaffold my-site
npx launch-stackwright my-site --otter-raft
```

## API Reference

### `registerScaffoldHook(hook)`

Register a hook to run during scaffolding.

```typescript
registerScaffoldHook({
  type: 'preInstall',
  name: 'my-hook',
  priority: 50,
  critical: false,
  handler: async (ctx) => { /* ... */ },
});
```

### `runScaffoldHooks(type, context)`

Internal - called by `@stackwright/cli` during scaffold.

```typescript
await runScaffoldHooks('preInstall', context);
```

## Debugging

Enable debug output:

```bash
DEBUG=scaffold-hooks npx launch-stackwright my-site --otter-raft
```

## License

MIT
