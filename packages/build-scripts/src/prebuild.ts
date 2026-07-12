/**
 * stackwright-prebuild
 *
 * Run before `next build` and `next dev` to process co-located images and
 * compile YAML content files into JSON that getStaticProps can read without
 * touching the filesystem at runtime.
 *
 * Usage (package.json):
 *   "prebuild": "stackwright-prebuild",
 *   "predev":   "stackwright-prebuild"
 *
 * Output (written to public/stackwright-content/):
 *   _site.json                            - processed site config (stackwright.yml)
 *   _theme.json                           - theme config (stackwright.theme.yml or extracted)
 *   _root.json                            - processed root page (pages/content.yml)
 *   <slug>.json                           - processed content for each slug page
 *   collections/<name>/_index.json        - sorted manifest for each collection
 *   collections/<name>/<slug>.json        - full entry data
 *   <basePath>/<slug>.json                - generated entry pages (from entryPage config)
 */

import fs from 'fs';
import path from 'path';
import type { PrebuildOptions } from '@stackwright/types';
import { createCompileContext, compileAll } from './compile';
import { discoverAndAttachPlugins } from './compile/context';
import { generateSitemap, generateRobotsTxt, collectPageMeta } from './seo';

// ---------------------------------------------------------------------------
// Re-exports for backward compatibility
// (tests and external code import these directly from 'prebuild')
// ---------------------------------------------------------------------------

export {
  // Font utilities (prebuild-fonts.test.ts imports these)
  extractGoogleFontNames,
  generateGoogleFontsUrl,
  generateFontLinkTags,
  getAllGoogleFontNames,
  downloadAndBundleFonts,
} from './compile';
export type { FontLink } from './compile';

export {
  // Icon utilities (prebuild-icons.test.ts imports these)
  collectIconSrcs,
  generateIconManifest,
  lucideExportName,
  isValidLucideExport,
  mapToValidLucideName,
} from './compile';

export {
  // Page utilities (prebuild-i18n.test.ts imports findContentFiles)
  findContentFiles,
} from './compile';

export {
  // Site utilities (available for programmatic callers)
  processSiteConfig,
  findLocaleConfigFiles,
} from './compile';

export {
  // Compile primitives (available for Pro plugin and advanced callers)
  compileAll,
  compileSite,
  compileTheme,
  compilePages,
  compileFileCollections,
  compileIcons,
  compileFonts,
  createCompileContext,
} from './compile';
export type { CompileContext } from './compile';

// ---------------------------------------------------------------------------
// runPrebuild — public entry point (thin wrapper over compileAll)
// ---------------------------------------------------------------------------

/**
 * Run the full Stackwright prebuild pipeline.
 *
 * Compiles all content (site, theme, pages, collections, icons, fonts) and
 * then runs build-time extras (search index, sitemap, SBOM).
 *
 * @param options - Project root path (string) or PrebuildOptions object
 */
export async function runPrebuild(options?: string | PrebuildOptions): Promise<void> {
  console.log('Stackwright prebuild starting...');

  const ctx = createCompileContext(options);

  // Auto-discover plugins from project node_modules (skipped when options.plugins is set).
  // Synchronous — must run before compileAll so plugins are wired before page validation.
  discoverAndAttachPlugins(ctx, options);

  // compileAll runs sync file-writes immediately (before any await),
  // then awaits async operations (fonts, image optimization, plugin hooks).
  // This preserves the original behavior where _site.json, _root.json, etc.
  // are written synchronously before any network operations.
  await compileAll(ctx);

  const { projectRoot, contentOutDir, publicDir } = ctx;

  // Search index (must run after all content is compiled)
  const searchIndexPath = path.join(contentOutDir, 'search-index.json');
  try {
    const { buildSearchIndex } = require('./build-searchIndex');
    const entries = buildSearchIndex(contentOutDir, searchIndexPath);
    console.log('\n  [OK] Search index: ' + entries.length + ' pages indexed');
  } catch (err) {
    console.warn('\n  [WARN] Search index generation skipped: ' + (err as Error).message);
  }

  // Sitemap + robots.txt
  const siteJsonPath = path.join(contentOutDir, '_site.json');
  if (fs.existsSync(siteJsonPath)) {
    const siteConfig = JSON.parse(fs.readFileSync(siteJsonPath, 'utf8')) as Record<string, unknown>;
    const siteMetaConfig = siteConfig.meta as Record<string, unknown> | undefined;
    const baseUrl = siteMetaConfig?.base_url as string | undefined;

    if (baseUrl) {
      const pages = collectPageMeta(contentOutDir);
      const buildDate = new Date().toISOString().split('T')[0];

      const sitemapXml = generateSitemap({ pages, baseUrl, buildDate });
      fs.writeFileSync(path.join(publicDir, 'sitemap.xml'), sitemapXml);
      console.log(`  [OK] sitemap.xml (${pages.filter((p) => !p.meta?.noindex).length} pages)`);

      const robotsTxt = generateRobotsTxt(baseUrl);
      fs.writeFileSync(path.join(publicDir, 'robots.txt'), robotsTxt);
      console.log('  [OK] robots.txt');
    } else {
      console.log(
        '  [INFO] Skipping sitemap.xml/robots.txt -- set meta.base_url in stackwright.yml to enable'
      );
    }
  }

  // SBOM (unless --no-sbom flag)
  if (!process.argv.includes('--no-sbom')) {
    const sbomStrict = process.argv.includes('--sbom-strict');
    try {
      const { createSBOM } = await import('@stackwright/sbom-generator');
      const sbomOutputDir = path.join(projectRoot, '.stackwright', 'sbom');
      const sbom = await createSBOM({
        projectRoot,
        formats: ['spdx', 'cyclonedx', 'build-manifest'],
        includeDevDependencies: false,
        includePeerDependencies: true,
        outputDir: sbomOutputDir,
      });
      await sbom.writeTo(sbomOutputDir);
      console.log('\n  [OK] SBOM generated: .stackwright/sbom/');
    } catch (error) {
      if (sbomStrict) {
        throw new Error(
          '[SBOM] Generation failed (--sbom-strict mode): ' +
            (error as Error).message +
            '\nRemove --sbom-strict or resolve the error to continue.'
        );
      }
      console.warn('\n  [WARN] SBOM generation failed (non-critical): ' + (error as Error).message);
    }
  }

  console.log('\nStackwright prebuild complete.\n');
}

// ---------------------------------------------------------------------------
// CLI entry point
// ---------------------------------------------------------------------------

if (require.main === module) {
  const watchMode = process.argv.includes('--watch');
  const noSBOM = process.argv.includes('--no-sbom');
  const sbomStrict = process.argv.includes('--sbom-strict');
  const noImageOptimization = process.argv.includes('--no-image-optimization');
  const noPluginDiscovery = process.argv.includes('--no-plugin-discovery');

  // --plugins pkg-a,pkg-b  (comma-separated override list)
  const pluginsArgIdx = process.argv.findIndex((a) => a === '--plugins');
  const pluginsArg = pluginsArgIdx !== -1 ? process.argv[pluginsArgIdx + 1] : undefined;
  const pluginOverride = pluginsArg
    ? pluginsArg
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    : undefined;

  if (noSBOM) console.log('[INFO] SBOM generation skipped (--no-sbom flag)');
  if (sbomStrict)
    console.log('[INFO] SBOM strict mode enabled -- build will fail if SBOM generation errors');
  if (noImageOptimization)
    console.log('[INFO] Image optimization skipped (--no-image-optimization flag)');
  if (noPluginDiscovery)
    console.log('[INFO] Plugin auto-discovery disabled (--no-plugin-discovery flag)');
  if (pluginOverride) console.log(`[INFO] Plugin discovery override: ${pluginOverride.join(', ')}`);

  if (watchMode) {
    const { runWatch } = require('./watch');
    runWatch();
  } else {
    (async () => {
      try {
        await runPrebuild({
          imageOptimization: noImageOptimization ? false : undefined,
          pluginDiscovery: noPluginDiscovery ? false : undefined,
          pluginOverride,
        });
      } catch (err) {
        console.error(`ERROR: ${(err as Error).message}`);
        process.exit(1);
      }
    })();
  }
}
