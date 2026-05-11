/**
 * Scaffold Hook Interfaces — canonical type contracts for the Stackwright scaffold hook system.
 *
 * These interfaces live in @stackwright/types so they are accessible to both
 * OSS packages and Pro packages without creating a dependency on any
 * implementing package.
 *
 * @stackwright/hooks-registry re-exports these types and provides the runtime
 * singleton registry. @stackwright/scaffold-core re-exports everything from
 * hooks-registry for consumer convenience.
 *
 * Consumer import paths (all equivalent, all backward-compatible):
 *   import type { ScaffoldHookContext } from '@stackwright/types'
 *   import type { ScaffoldHookContext } from '@stackwright/hooks-registry'
 *   import type { ScaffoldHookContext } from '@stackwright/scaffold-core'
 */

/**
 * Lifecycle points in the scaffold process.
 *
 * Execution order: preScaffold → preInstall → postInstall → postScaffold
 */
export type ScaffoldHookType =
  | 'preScaffold' // Before scaffolding begins
  | 'preInstall' // After files created, before pnpm install
  | 'postInstall' // After pnpm install completes
  | 'postScaffold'; // After scaffolding complete

/**
 * Handler function signature for scaffold hooks.
 *
 * Handlers may be async or sync. Returning a rejected Promise (or throwing)
 * is treated as failure; whether failure aborts scaffolding depends on
 * ScaffoldHook.critical.
 */
export type HookHandler = (context: ScaffoldHookContext) => Promise<void> | void;

/**
 * A single scaffold hook registration.
 */
export interface ScaffoldHook {
  /** Lifecycle point when this hook runs. */
  type: ScaffoldHookType;
  /** Unique name for the hook — used as the registry key. */
  name: string;
  /** Lower priority value = runs first. Defaults to 50. */
  priority?: number;
  /** If true, hook failure aborts the entire scaffold. Defaults to false. */
  critical?: boolean;
  /** The handler to invoke at the given lifecycle point. */
  handler: HookHandler;
}

/**
 * Context object passed to every hook handler.
 *
 * The object is mutable — hooks may add dependencies to `packageJson` or
 * register MCP servers in `codePuppyConfig`. Changes made by earlier hooks
 * are visible to later hooks in priority order.
 */
export interface ScaffoldHookContext {
  /** Absolute path to the new project directory. */
  targetDir: string;
  /** Package name / directory name of the new project. */
  projectName: string;
  /** Human-readable site title (used in stackwright.yml). */
  siteTitle: string;
  /** Stackwright theme identifier selected during scaffold. */
  themeId: string;
  /** Mutable package.json contents — hooks may add/modify dependencies. */
  packageJson: Record<string, unknown>;
  /** Mutable .code-puppy.json config — hooks may register MCP servers. */
  codePuppyConfig?: Record<string, unknown>;
  /** Whether dependencies use workspace:* protocol or pinned versions. */
  dependencyMode: 'workspace' | 'standalone';
  /** Page slugs that will be created by the scaffold. */
  pages?: string[];
  /** Whether to auto-install dependencies after scaffolding. */
  install?: boolean;
  /** Open-ended extension point — hooks may attach arbitrary metadata. */
  [key: string]: unknown;
}
