/**
 * Scaffold Hook Types
 *
 * Hooks allow Pro packages to extend scaffold with:
 * - Enterprise license injection
 * - Custom MCP server configuration
 * - Additional project setup
 * - Post-install verification
 */

/**
 * Hook types representing lifecycle points in scaffolding
 */
export type ScaffoldHookType =
  | 'preScaffold' // Before scaffolding begins
  | 'preInstall' // After files created, before pnpm install
  | 'postInstall' // After pnpm install completes
  | 'postScaffold'; // After scaffolding complete

/**
 * A single scaffold hook
 */
export interface ScaffoldHook {
  /** Lifecycle point when hook runs */
  type: ScaffoldHookType;
  /** Unique name for the hook */
  name: string;
  /** Lower priority = runs first (default: 50) */
  priority?: number;
  /** If true, hook failure fails entire scaffold (default: false) */
  critical?: boolean;
  /** Hook handler function */
  handler: (context: ScaffoldHookContext) => Promise<void> | void;
}

/**
 * Hook registration options
 */
export interface ScaffoldHookOptions extends Partial<ScaffoldHook> {
  type: ScaffoldHookType;
  name: string;
}

/**
 * Context passed to all hooks
 */
export interface ScaffoldHookContext {
  /** Target directory for the new project */
  targetDir: string;
  /** Project name */
  projectName: string;
  /** Site title */
  siteTitle: string;
  /** Theme ID */
  themeId: string;
  /** Mutable package.json - hooks can add dependencies */
  packageJson: Record<string, any>;
  /** Mutable .code-puppy.json config - hooks can add MCP servers */
  codePuppyConfig?: Record<string, any>;
  /** Dependency mode: workspace:* or versioned */
  dependencyMode: 'workspace' | 'standalone';
  /** Pages that will be created */
  pages?: string[];
  /** Whether to install dependencies automatically */
  install?: boolean;
  /** Additional properties hooks can add */
  [key: string]: any;
}
