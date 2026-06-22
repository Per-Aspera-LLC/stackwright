/**
 * @stackwright/build-scripts
 *
 * Programmatic API for Stackwright build utilities.
 * For CLI usage, use the `stackwright-prebuild` binary.
 */

// Primary entry point (backward compat)
export { runPrebuild } from './prebuild';
export { runWatch } from './watch';

// Compile primitives (new in swp-xyia — available for Pro plugin integration)
export {
  compileAll,
  compileSite,
  compileTheme,
  compilePages,
  compileFileCollections,
  compileIcons,
  compileFonts,
  createCompileContext,
} from './compile';
export type { CompileContext, SiteCompileResult, FileCollectionsResult } from './compile';

// Re-exported types from @stackwright/types (convenience — avoids double-dep for callers)
export type { PrebuildOptions, PrebuildPlugin, PrebuildPluginContext } from '@stackwright/types';
export type { SBOMOptions, SBOM, SBOMFormat } from '@stackwright/sbom-generator';

// SEO utilities
export { generateSitemap, generateRobotsTxt, collectPageMeta } from './seo';
export type { PageEntry, PageMeta, SitemapOptions } from './seo';
