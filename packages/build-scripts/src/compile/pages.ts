import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import { z } from 'zod';
import { validatePageContent } from '@stackwright/types/validation';
import type { PrebuildPlugin } from '@stackwright/types';
import {
  copyIfNewer,
  rewritePaths,
  isColocatablePath,
  isVideoPath,
} from './path-utils';
import {
  processImageOptimization,
  type ImageManifest,
} from '../image-optimizer';
import type { ImageOptimizationConfig } from '@stackwright/types';
import type { CompileContext } from './context';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ContentFile {
  slug: string | null;
  filePath: string;
  contentDir: string;
  locale?: string;
}

const LARGE_VIDEO_THRESHOLD_MB = 50;

/** BCP 47 locale tag: e.g. "fr", "en-US". */
const LOCALE_TAG_REGEX = /^[a-z]{2}(-[A-Z]{2})?$/;

// ---------------------------------------------------------------------------
// findContentFiles (exported — tests import this directly from prebuild.ts,
// which will re-export it from here)
// ---------------------------------------------------------------------------

/** Recursively find all content.yml / content.yaml files under dir. */
export function findContentFiles(dir: string, baseSlug = ''): ContentFile[] {
  const results: ContentFile[] = [];
  if (!fs.existsSync(dir)) return results;

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      const subSlug = baseSlug ? `${baseSlug}/${entry.name}` : entry.name;
      results.push(...findContentFiles(path.join(dir, entry.name), subSlug));
    } else if (entry.name === 'content.yml' || entry.name === 'content.yaml') {
      results.push({ slug: baseSlug || null, filePath: path.join(dir, entry.name), contentDir: dir });
    } else {
      const localeMatch = entry.name.match(/^content\.([^.]+)\.(yml|yaml)$/);
      if (localeMatch) {
        const locale = localeMatch[1];
        if (LOCALE_TAG_REGEX.test(locale)) {
          results.push({
            slug: baseSlug || null,
            filePath: path.join(dir, entry.name),
            contentDir: dir,
            locale,
          });
        }
      }
    }
  }
  return results;
}

// ---------------------------------------------------------------------------
// Content normalization (mapping-key format -> type-field format)
// ---------------------------------------------------------------------------

function normalizeNestedContent(obj: Record<string, unknown>): Record<string, unknown> {
  const result = { ...obj };
  if (Array.isArray(obj.content_items)) {
    result.content_items = (obj.content_items as unknown[]).map(normalizeContentItem);
  }
  if (Array.isArray(obj.tabs)) {
    result.tabs = (obj.tabs as unknown[]).map(normalizeContentItem);
  }
  if (Array.isArray(obj.columns)) {
    result.columns = (obj.columns as Record<string, unknown>[]).map((col) => ({
      ...col,
      ...(Array.isArray(col.content_items)
        ? { content_items: (col.content_items as unknown[]).map(normalizeContentItem) }
        : {}),
    }));
  }
  return result;
}

function normalizeContentItem(item: unknown): unknown {
  if (!item || typeof item !== 'object' || Array.isArray(item)) return item;
  const obj = item as Record<string, unknown>;

  if (typeof obj.type === 'string') return normalizeNestedContent(obj);

  // Mapping-key format: exactly one key whose value is a plain object
  const keys = Object.keys(obj);
  if (keys.length === 1) {
    const [typeKey] = keys;
    const value = obj[typeKey];
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      return normalizeNestedContent({ type: typeKey, ...(value as Record<string, unknown>) });
    }
  }

  return obj;
}

export function normalizePageContent(rawContent: unknown): unknown {
  if (!rawContent || typeof rawContent !== 'object') return rawContent;
  const page = rawContent as Record<string, unknown>;

  // App-shell flat array format
  if (Array.isArray(page.content)) {
    return {
      ...page,
      content: { content_items: (page.content as unknown[]).map(normalizeContentItem) },
    };
  }

  const content = page.content as Record<string, unknown> | undefined;
  if (!content) return rawContent;
  const items = content.content_items;
  if (!Array.isArray(items)) return rawContent;
  return {
    ...page,
    content: { ...content, content_items: items.map(normalizeContentItem) },
  };
}

// ---------------------------------------------------------------------------
// Content type collection (for plugin-type warnings)
// ---------------------------------------------------------------------------

function collectContentTypes(obj: unknown, result: Set<string> = new Set()): Set<string> {
  if (!obj || typeof obj !== 'object') return result;
  if (Array.isArray(obj)) {
    for (const item of obj) collectContentTypes(item, result);
    return result;
  }
  const record = obj as Record<string, unknown>;
  if (typeof record.type === 'string') result.add(record.type);
  for (const value of Object.values(record)) collectContentTypes(value, result);
  return result;
}

// ---------------------------------------------------------------------------
// Page content image processing
// ---------------------------------------------------------------------------

/**
 * Process content YAML: copy `./relative` images to imageDestDir, rewrite to publicPrefix.
 */
export function processPageContent(
  content: unknown,
  contentDir: string,
  imageDestDir: string,
  publicPrefix: string,
  rootDir: string
): unknown {
  return rewritePaths(content, (str) => {
    if (!str.startsWith('./') || !isColocatablePath(str)) return str;

    const srcPath = path.resolve(contentDir, str);
    if (!fs.existsSync(srcPath)) {
      console.warn(`  WARNING: Content image not found: ${srcPath}`);
      return str;
    }

    const filename = path.basename(str);
    const destPath = path.join(imageDestDir, filename);
    copyIfNewer(srcPath, destPath, rootDir);

    if (isVideoPath(str)) {
      const fileSizeMB = fs.statSync(srcPath).size / (1024 * 1024);
      if (fileSizeMB > LARGE_VIDEO_THRESHOLD_MB) {
        console.warn(
          `  WARNING: Large video file: ${path.relative(rootDir, srcPath)} (${fileSizeMB.toFixed(1)} MB). ` +
            `Consider using adaptive streaming (MPEG-DASH/HLS) or a video CDN for files this size.`
        );
      }
    }

    return `${publicPrefix}/${filename}`;
  });
}

// ---------------------------------------------------------------------------
// Collection entry injection
// ---------------------------------------------------------------------------

/**
 * Walk page content items and inject `_entries` into any `collection_list` blocks.
 */
export function injectCollectionEntries(
  pageContent: unknown,
  collectionIndexes: Map<string, Record<string, unknown>[]>
): unknown {
  if (pageContent === null || typeof pageContent !== 'object') return pageContent;
  if (Array.isArray(pageContent)) {
    return pageContent.map((item) => injectCollectionEntries(item, collectionIndexes));
  }

  const obj = pageContent as Record<string, unknown>;

  if (obj.type === 'collection_list') {
    const source = obj.source as string | undefined;
    if (source && collectionIndexes.has(source)) {
      return { ...obj, _entries: collectionIndexes.get(source) };
    }
    if (source) {
      console.warn(`  WARNING: collection_list references unknown collection "${source}".`);
    }
    return obj;
  }

  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    result[key] = injectCollectionEntries(value, collectionIndexes);
  }
  return result;
}

// ---------------------------------------------------------------------------
// Image optimization pass helpers
// ---------------------------------------------------------------------------

function collectAllCopiedImages(dir: string): string[] {
  const results: string[] = [];
  if (!fs.existsSync(dir)) return results;

  function walk(d: string): void {
    for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
      const full = path.join(d, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else if (
        ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp', '.ico'].includes(
          path.extname(entry.name).toLowerCase()
        )
      ) {
        results.push(full);
      }
    }
  }
  walk(dir);
  return results;
}

function enrichContentJsonsWithBlur(contentOutDir: string, manifest: ImageManifest): void {
  function enrichNode(node: unknown): unknown {
    if (Array.isArray(node)) return node.map(enrichNode);
    if (node !== null && typeof node === 'object') {
      const obj = node as Record<string, unknown>;
      const result: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(obj)) {
        result[key] = enrichNode(value);
      }
      if (typeof result.src === 'string' && manifest[result.src]?.blurDataURL) {
        result.blurDataURL = manifest[result.src].blurDataURL;
      }
      return result;
    }
    return node;
  }

  function processJsonFile(filePath: string): void {
    const raw = fs.readFileSync(filePath, 'utf8');
    let data: unknown;
    try {
      data = JSON.parse(raw);
    } catch {
      return;
    }
    const enriched = enrichNode(data);
    const enrichedStr = JSON.stringify(enriched, null, 2);
    if (enrichedStr !== raw) fs.writeFileSync(filePath, enrichedStr);
  }

  function walkJsonFiles(dir: string): void {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walkJsonFiles(full);
      } else if (entry.name.endsWith('.json') && !entry.name.startsWith('_image-manifest')) {
        processJsonFile(full);
      }
    }
  }
  walkJsonFiles(contentOutDir);
}

// ---------------------------------------------------------------------------
// compilePages orchestrator
// ---------------------------------------------------------------------------

/**
 * Compile page content files and write `_root.json` + per-slug JSONs.
 *
 * Synchronous: YAML parsing + file writes. Image optimization is handled
 * separately by `optimizeImages()` after all pages are written.
 *
 * Requires compileSite() + compileFileCollections() to have run first.
 *
 * @param collectionIndexes - pre-built collection indexes from compileFileCollections
 */
export function compilePages(
  ctx: CompileContext,
  collectionIndexes: Map<string, Record<string, unknown>[]> = new Map()
): ImageOptimizationConfig {
  const { projectRoot, contentOutDir, imagesDir, plugins, unknownContentTypes } = ctx;

  const pagesDir = path.join(projectRoot, 'pages');

  // Read image opt config from compiled _site.json
  const siteJsonPath = path.join(contentOutDir, '_site.json');
  let imageOptConfig: ImageOptimizationConfig = {
    enabled: ctx.imageOptimizationEnabled,
    formats: ['webp'],
    quality: 80,
    maxWidth: 1920,
    blur: true,
    blurSize: 10,
  };
  if (fs.existsSync(siteJsonPath)) {
    const siteConfig = JSON.parse(fs.readFileSync(siteJsonPath, 'utf8')) as Record<string, unknown>;
    const siteImageConfig = siteConfig.imageOptimization as Record<string, unknown> | undefined;
    imageOptConfig = {
      enabled: ctx.imageOptimizationEnabled && siteImageConfig?.enabled !== false,
      formats: (siteImageConfig?.formats as ('webp' | 'avif')[]) ?? ['webp'],
      quality: (siteImageConfig?.quality as number) ?? 80,
      maxWidth: (siteImageConfig?.maxWidth as number) ?? 1920,
      blur: (siteImageConfig?.blur as boolean) ?? true,
      blurSize: (siteImageConfig?.blurSize as number) ?? 10,
    };
  }

  if (imageOptConfig.enabled) {
    console.log(
      `\n  Image optimization: ON (formats: ${imageOptConfig.formats.join(', ')}, quality: ${imageOptConfig.quality}, maxWidth: ${imageOptConfig.maxWidth}, blur: ${imageOptConfig.blur})`
    );
  } else {
    console.log('\n  Image optimization: OFF');
  }

  // Collect plugin schemas + known types for validation
  const extraContentSchemas = plugins.flatMap((p) => p.contentItemSchemas ?? []) as z.ZodTypeAny[];
  const pluginKnownTypes = plugins.flatMap((p) => p.knownContentTypeKeys ?? []);

  console.log('\nProcessing pages...');
  const contentFiles = findContentFiles(pagesDir);

  if (contentFiles.length === 0) {
    console.warn('  WARNING: No content.yml files found in pages/');
  }

  for (const { slug, filePath, contentDir, locale } of contentFiles) {
    const label = slug ?? '(root)';
    const rawContent = yaml.load(fs.readFileSync(filePath, 'utf8'));
    const normalizedContent = normalizePageContent(rawContent);

    const pageValidation = validatePageContent(normalizedContent, {
      extraContentItemSchemas: extraContentSchemas,
      allowedExtraTypes: pluginKnownTypes,
    });
    if (!pageValidation.valid) {
      const output = [
        `Invalid content: ${filePath}`,
        ...pageValidation.errors.map(
          (e) =>
            `  ${e.fieldPath}: ${e.hint}${e.suggestion ? ` (did you mean "${e.suggestion}"?)` : ''}`
        ),
      ].join('\n');
      if (unknownContentTypes === 'error') {
        throw new Error(output);
      } else if (unknownContentTypes === 'warn') {
        console.warn(`  [WARN] ${output}`);
      }
    }

    // Warn when plugin-declared types appear in pages
    if (pageValidation.valid && pluginKnownTypes.length > 0) {
      const usedTypes = collectContentTypes(normalizedContent);
      const pluginTypesUsed = [...usedTypes].filter((t) => pluginKnownTypes.includes(t));
      if (pluginTypesUsed.length > 0) {
        const declaringPlugins = plugins
          .filter((p) => (p.knownContentTypeKeys ?? []).some((k) => pluginTypesUsed.includes(k)))
          .map((p) => p.name);
        console.warn(
          `  [WARN] ${label}: uses ${pluginTypesUsed.length} plugin-declared type(s) [${declaringPlugins.join(', ')}]: ${pluginTypesUsed.join(', ')}\n` +
            `     Ensure registerContentType() is called in your app for each of these types.`
        );
      }
    }

    const slugDir = slug ?? '_root';
    const imageDestDir = locale
      ? path.join(imagesDir, locale, slugDir)
      : path.join(imagesDir, slugDir);
    const publicPrefix = locale ? `/images/${locale}/${slugDir}` : `/images/${slugDir}`;

    const processedContent = processPageContent(
      normalizedContent,
      contentDir,
      imageDestDir,
      publicPrefix,
      projectRoot
    );
    const expandedContent = injectCollectionEntries(processedContent, collectionIndexes);

    const outFile = slug ? `${slug}.json` : '_root.json';
    const outPath = path.join(contentOutDir, locale ?? '', outFile);
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, JSON.stringify(expandedContent, null, 2));
    const logPath = locale ? `${locale}/${outFile}` : outFile;
    const logLabel = locale ? `${label} [${locale}]` : label;
    console.log(`  OK ${logPath}  (${logLabel})`);
  }

  // Return resolved imageOptConfig so compileAll can run the async image pass
  return imageOptConfig;
}

/**
 * Async image optimization pass — runs after all page files are written.
 * Call this after `compilePages()` and `compileIcons()` so all JSON files
 * are in place and blurDataURL enrichment covers everything.
 */
export async function optimizeImages(
  ctx: CompileContext,
  imageOptConfig: ImageOptimizationConfig
): Promise<void> {
  const { projectRoot, contentOutDir, imagesDir } = ctx;

  if (!imageOptConfig.enabled) return;

  console.log('\nOptimizing images...');
  const imageFiles = collectAllCopiedImages(imagesDir);
  const imageManifest: ImageManifest = {};
  let optimizedCount = 0;

  for (const absPath of imageFiles) {
    const destDir = path.dirname(absPath);
    const publicPrefix =
      '/' + path.relative(path.join(projectRoot, 'public'), destDir).split(path.sep).join('/');
    const entry = await processImageOptimization(
      absPath,
      destDir,
      publicPrefix,
      imageOptConfig,
      projectRoot
    );
    if (entry) {
      imageManifest[entry.original] = entry;
      optimizedCount++;
    }
  }

  console.log(
    `  [OK] Optimized ${optimizedCount} image(s), ${Object.keys(imageManifest).length} manifest entries`
  );

  const manifestPath = path.join(contentOutDir, '_image-manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(imageManifest, null, 2));
  console.log('  [OK] Written _image-manifest.json');

  if (Object.keys(imageManifest).length > 0) {
    enrichContentJsonsWithBlur(contentOutDir, imageManifest);
    console.log('  [OK] Enriched content JSONs with blur placeholders');
  }
}

