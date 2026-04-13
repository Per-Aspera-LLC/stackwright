# @stackwright/hooks-registry

Singleton registry for scaffold hooks. Uses `Symbol.for()` pattern to survive module boundary crossings between different package copies.

## Why a Separate Package?

The `@stackwright/scaffold-core` package already has a hooks registry, but it uses module-level variables which can be reset when modules are reloaded or when multiple instances of the package exist in different parts of the monorepo.

This package provides a **truly persistent singleton** that:

1. Survives module boundary crossings
2. Works correctly across different parts of a monorepo
3. Provides consistent behavior for Pro hooks

## Installation

```bash
# Already included via workspace
import { registerScaffoldHook } from '@stackwright/hooks-registry';
```

## Usage

### Register a Hook

```typescript
import { registerScaffoldHook } from '@stackwright/hooks-registry';

registerScaffoldHook({
  type: 'preInstall',
  name: 'enterprise-license',
  priority: 10,
  critical: true,
  handler: async (context) => {
    if (!process.env.PRO_API_KEY) {
      throw new Error('PRO_API_KEY required');
    }
    context.packageJson.dependencies['@stackwright-pro/license'] = '^1.0.0';
  },
});
```

### Get All Hooks

```typescript
import { getScaffoldHooks, getScaffoldHooksForType } from '@stackwright/hooks-registry';

// Get all hooks
const allHooks = getScaffoldHooks();

// Get hooks for specific lifecycle point
const preInstallHooks = getScaffoldHooksForType('preInstall');
```

### Run Hooks

```typescript
import { runScaffoldHooks } from '@stackwright/hooks-registry';

const context = {
  targetDir: '/path/to/project',
  projectName: 'my-site',
  siteTitle: 'My Site',
  themeId: 'default',
  packageJson: {},
  dependencyMode: 'workspace',
};

await runScaffoldHooks('preInstall', context);
```

### Clear Hooks

```typescript
import { clearScaffoldHooks, resetForTesting } from '@stackwright/hooks-registry';

// Clear all hooks
clearScaffoldHooks();

// Reset for testing isolation
resetForTesting();
```

## Hook Types

| Type | When | Use Case |
|------|------|----------|
| `preScaffold` | Before scaffolding begins | Validate environment, check licenses |
| `preInstall` | After files created, before `pnpm install` | Modify `package.json`, add dependencies |
| `postInstall` | After `pnpm install` completes | Verify installation, run setup scripts |
| `postScaffold` | After scaffolding complete | Final configuration, cleanup |

## Hook Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `type` | `ScaffoldHookType` | Required | Lifecycle point |
| `name` | `string` | Required | Unique hook name |
| `priority` | `number` | `50` | Lower = runs first |
| `critical` | `boolean` | `false` | If true, failure fails entire scaffold |
| `handler` | `function` | Required | Async function to execute |

## Context Object

The context passed to hooks:

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
  install?: boolean;           // Whether install will run
  [key: string]: any;         // Hooks can add custom properties
}
```

## API Reference

### registerScaffoldHook(hook)

Register a hook to run during scaffolding. Hooks are sorted by priority (lower = runs first).

### getScaffoldHooks()

Get all registered hooks as a readonly array.

### getScaffoldHooksForType(type)

Get hooks for a specific lifecycle point.

### clearScaffoldHooks()

Remove all registered hooks.

### resetForTesting()

Clear hooks and reset global state for test isolation.

### runScaffoldHooks(type, context)

Execute all hooks of a given type. Critical hook failures throw; non-critical failures are logged and execution continues.

## Testing

```bash
pnpm --filter @stackwright/hooks-registry test
```

## Build

```bash
pnpm --filter @stackwright/hooks-registry build
```