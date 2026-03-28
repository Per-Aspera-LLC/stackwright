/**
 * Plugin interface for Stackwright prebuild extensions
 *
 * Plugins can hook into the prebuild process to generate additional code,
 * process custom configurations, or extend the build pipeline.
 *
 * Example: @stackwright-pro/openapi plugin generates Zod schemas and
 * TypeScript types from OpenAPI specs during prebuild.
 */

/**
 * Plugin context provided to plugin hooks
 */
export interface PrebuildPluginContext {
  /** Project root directory */
  projectRoot: string;

  /** Parsed site config (stackwright.yml) */
  siteConfig: Record<string, unknown>;

  /** Output directory for generated content (public/stackwright-content) */
  contentOutDir: string;

  /** Images directory (public/images) */
  imagesDir: string;

  /** Generated source code directory (src/generated) */
  generatedDir?: string;
}

/**
 * Plugin hook lifecycle
 */
export interface PrebuildPlugin {
  /** Plugin name (for logging) */
  name: string;

  /**
   * Called after site config is loaded but before page/collection processing
   *
   * Use this hook to:
   * - Generate code from external sources (OpenAPI specs, GraphQL schemas, etc.)
   * - Process custom configuration sections
   * - Set up additional build artifacts
   *
   * @param context - Plugin context with project paths and config
   */
  beforeBuild?: (context: PrebuildPluginContext) => Promise<void> | void;

  /**
   * Called after all pages and collections are processed
   *
   * Use this hook to:
   * - Post-process generated content
   * - Generate summary files or indexes
   * - Clean up temporary artifacts
   *
   * @param context - Plugin context
   */
  afterBuild?: (context: PrebuildPluginContext) => Promise<void> | void;
}

/**
 * Options for runPrebuild
 */
export interface PrebuildOptions {
  /** Project root directory (defaults to process.cwd()) */
  projectRoot?: string;

  /** Plugins to run during prebuild */
  plugins?: PrebuildPlugin[];
}
