/**
 * Plugin interface for Stackwright prebuild extensions
 *
 * Plugins can hook into the prebuild process to generate additional code,
 * process custom configurations, or extend the build pipeline.
 *
 * Example: @stackwright-pro/openapi plugin generates Zod schemas and
 * TypeScript types from OpenAPI specs during prebuild.
 */

import { z } from 'zod';

/**
 * Minimal structural interface used in place of z.ZodTypeAny / z.ZodSchema
 * in the PrebuildPlugin public API.
 *
 * Using a structural interface prevents zod-version-specific internal types
 * from bleeding into the published .d.ts. Any real Zod schema satisfies this
 * via duck-typing, so existing implementations are unaffected.
 */
interface ZodLike {
  safeParse(data: unknown): { success: boolean; error?: unknown };
}

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
   * Optional schema for validating integration configs.
   *
   * When a plugin declares a configSchema, the prebuild pipeline will validate
   * any integration configs of type `integration-{plugin.name}` against this schema.
   * This prevents:
   * - Prototype pollution attacks (__proto__, constructor)
   * - Plugin-specific malicious options
   * - Config without type safety
   *
   * @example
   * ```typescript
   * const myPlugin: PrebuildPlugin = {
   *   name: 'openapi',
   *   configSchema: z.object({
   *     spec: z.string(),
   *     timeout: z.number().optional(),
   *   }),
   *   beforeBuild: async (ctx) => { /* ... *\/ },
   * };
   * ```
   */
  configSchema?: ZodLike;

  /**
   * Additional Zod schemas for content items provided by this plugin.
   *
   * When registered, the prebuild will include these schemas in the content
   * item union validator, allowing pro content types to pass validation.
   * Each schema should match objects with a `type` field set to the plugin's
   * content type name(s).
   *
   * @example
   * ```typescript
   * const myPlugin: PrebuildPlugin = {
   *   name: 'pro-content',
   *   contentItemSchemas: [
   *     z.object({ type: z.literal('page_header') }).passthrough(),
   *     z.object({ type: z.literal('stats_grid') }).passthrough(),
   *   ],
   * };
   * ```
   */
  contentItemSchemas?: ZodLike[];

  /**
   * Additional content type key strings recognized by this plugin.
   *
   * Type strings listed here will NOT generate "unknown content type" errors
   * during prebuild validation. Should match the `type` values used in the
   * plugin's content item schemas.
   *
   * @example
   * ```typescript
   * knownContentTypeKeys: ['page_header', 'stats_grid', 'two_column_layout'],
   * ```
   */
  knownContentTypeKeys?: readonly string[];

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

  /**
   * How to handle unknown or invalid content type errors during page validation.
   *
   * - `'error'` (default): throw and abort the build. Correct for CI/production.
   * - `'warn'`: log a warning and continue. Useful during development or for
   *   demo projects where content types may be ahead of their implementations.
   * - `'ignore'`: silently skip content validation errors and continue.
   *
   * Note: this option does not affect site config (stackwright.yml) validation,
   * which always fails hard on invalid config.
   */
  unknownContentTypes?: 'error' | 'warn' | 'ignore';
}
