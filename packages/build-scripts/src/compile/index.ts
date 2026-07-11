/**
 * @stackwright/build-scripts compile primitives
 *
 * Each function compiles one concern into one or more JSON sinks in
 * `public/stackwright-content/`. They can be called individually (for
 * partial rebuilds) or via `compileAll()` for a full build.
 *
 * Import order within compileAll:
 *   compileSite -> compileTheme -> compileFileCollections -> compilePages
 *   -> compileIcons -> compileFonts -> plugin additionalSinks -> afterBuild hooks
 */

export { compileSite, processSiteConfig, findLocaleConfigFiles } from './site';
export type { SiteCompileResult } from './site';

export { compileTheme } from './theme';

export {
  compilePages,
  optimizeImages,
  findContentFiles,
  normalizePageContent,
  processPageContent,
  injectCollectionEntries,
} from './pages';

export { compileFileCollections, generateEntryPages } from './collections';
export type { FileCollectionsResult } from './collections';

export {
  compileIcons,
  collectIconSrcs,
  generateIconManifest,
  lucideExportName,
  isValidLucideExport,
  mapToValidLucideName,
} from './icons';

export {
  compileFonts,
  extractGoogleFontNames,
  generateGoogleFontsUrl,
  generateFontLinkTags,
  getAllGoogleFontNames,
  downloadAndBundleFonts,
} from './fonts';
export type { FontLink } from './fonts';

export { createCompileContext, toPluginContext, discoverAndAttachPlugins } from './context';
export type { CompileContext } from './context';

export { discoverPlugins, CANONICAL_PRO_BUNDLE } from './discover';
export type { DiscoverPluginsOptions } from './discover';

// ---------------------------------------------------------------------------
// compileAll
// ---------------------------------------------------------------------------

import path from 'path';
import { compileSite } from './site';
import { compileTheme } from './theme';
import { compileFileCollections } from './collections';
import { compilePages, optimizeImages, findContentFiles } from './pages';
import { compileIcons } from './icons';
import { compileFonts } from './fonts';
import { toPluginContext } from './context';
import type { CompileContext } from './context';

/**
 * Run all compile steps in the correct order.
 *
 * Sequence:
 * 1. compileSite      -> _site.json            (must be first; plugins need siteConfig)
 * 2. compileTheme     -> _theme.json
 * 3. beforeBuild plugin hooks (receives real siteConfig — matches original contract)
 * 4. compileFileCollections -> collections/**
 * 5. compilePages     -> _root.json, <slug>.json, _image-manifest.json
 * 6. compileIcons     -> _icon-manifest.json, stackwright-generated/icons.ts
 * 7. compileFonts     -> _font-links.json
 * 8. plugin additionalSinks (Bead 2 plugs in here)
 * 9. afterBuild plugin hooks
 */
export async function compileAll(ctx: CompileContext): Promise<void> {
  // 1. Site config (must run first; plugins need siteConfig in beforeBuild)
  // Synchronous — file I/O only.
  const { processedConfig } = compileSite(ctx);

  // 2. Theme — synchronous
  compileTheme(ctx);

  // 3. beforeBuild hooks (siteConfig is now available)
  if (ctx.plugins.length > 0) {
    console.log('\nRunning beforeBuild plugins...');
    const pluginCtx = toPluginContext(ctx, processedConfig);
    for (const plugin of ctx.plugins) {
      if (!plugin.beforeBuild) continue;
      try {
        console.log(`  Running ${plugin.name} (beforeBuild)...`);
        await Promise.resolve(plugin.beforeBuild(pluginCtx));
      } catch (err) {
        throw new Error(
          `Plugin "${plugin.name}" failed during beforeBuild: ${(err as Error).message}`
        );
      }
    }
  }

  // 4. Collections — synchronous
  const { indexes: collectionIndexes, entryPagePaths } = compileFileCollections(ctx);

  // 5. Pages — synchronous (writes JSON files, returns imageOptConfig for the async pass)
  const imageOptConfig = compilePages(ctx, collectionIndexes);

  // Warn about collisions between generated entry pages and authored pages
  if (entryPagePaths.length > 0) {
    const pagesDir = path.join(ctx.projectRoot, 'pages');
    const contentFiles = findContentFiles(pagesDir);
    const pageSlugs = new Set(contentFiles.map(({ slug }) => slug).filter(Boolean));
    for (const entryPath of entryPagePaths) {
      if (pageSlugs.has(entryPath)) {
        console.warn(
          `  WARNING: Collection entry page "${entryPath}" collides with a manually-authored page. ` +
            'The manual page will take precedence.'
        );
      }
    }
  }

  // 6. Icons — synchronous (must run after pages so all JSON content is in contentOutDir)
  compileIcons(ctx);

  // 7. Image optimization — async (network or CPU-intensive sharp processing)
  await optimizeImages(ctx, imageOptConfig);

  // 8. Fonts — async (may need to download from Google Fonts)
  await compileFonts(ctx);

  // 9. Plugin additional sinks (Bead 2 will plug Pro sinks in here)
  if (ctx.plugins.length > 0) {
    const pluginCtx = toPluginContext(ctx, processedConfig);
    for (const plugin of ctx.plugins) {
      for (const sink of plugin.additionalSinks ?? []) {
        try {
          console.log(`  Running additional sink: ${sink.name}...`);
          await Promise.resolve(sink.compile(pluginCtx));
        } catch (err) {
          throw new Error(`Plugin sink "${sink.name}" failed: ${(err as Error).message}`);
        }
      }
    }
  }

  // 10. afterBuild hooks
  if (ctx.plugins.length > 0) {
    console.log('\nRunning afterBuild plugins...');
    const pluginCtx = toPluginContext(ctx, processedConfig);
    for (const plugin of ctx.plugins) {
      if (!plugin.afterBuild) continue;
      try {
        console.log(`  Running ${plugin.name} (afterBuild)...`);
        await Promise.resolve(plugin.afterBuild(pluginCtx));
      } catch (err) {
        throw new Error(
          `Plugin "${plugin.name}" failed during afterBuild: ${(err as Error).message}`
        );
      }
    }
  }
}
