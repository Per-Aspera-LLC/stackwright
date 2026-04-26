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
 *   _root.json                            - processed root page (pages/content.yml)
 *   <slug>.json                           - processed content for each slug page
 *   collections/<name>/_index.json        - sorted manifest for each collection
 *   collections/<name>/<slug>.json        - full entry data
 *   <basePath>/<slug>.json                - generated entry pages (from entryPage config)
 *
 * Images are copied to public/images/ with directory structure preserved.
 */

import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import {
  siteConfigSchema,
  validatePageContent,
  collectionConfigSchema,
  VIDEO_EXTENSIONS as VIDEO_EXTENSIONS_ARRAY,
  resolveEnvVarsDeep,
  buildExtendedPageContentSchema,
} from '@stackwright/types';
import type {
  CollectionConfig,
  EntryPageConfig,
  PageContent,
  TypographyVariant,
  PrebuildOptions,
  PrebuildPlugin,
  PrebuildPluginContext,
} from '@stackwright/types';

/**
 * Recursively resolve environment variable references in config values.
 * Replaces $VAR_NAME with actual env var values at build time.
 */
function applyEnvVarResolution(obj: unknown): unknown {
  return resolveEnvVarsDeep(obj);
}

/**
 * Validate an integration config against its plugin's schema (if available).
 *
 * Security: This function validates integration configs passed through from
 * stackwright.yml against the declaring plugin's configSchema. This prevents:
 * - Prototype pollution attacks (__proto__, constructor)
 * - Plugin-specific malicious options
 * - Config without type safety
 *
 * Throws if validation fails.
 */
function validateIntegrationConfig(
  integration: Record<string, unknown>,
  plugins: PrebuildPlugin[]
): void {
  // Integration type is formatted as "integration-{pluginName}"
  const integrationType = integration.type as string | undefined;
  if (!integrationType) {
    // No type specified - let Zod schema handle this
    return;
  }

  // Look for a plugin that handles this integration type
  // Plugin names are like "integration-openapi", "integration-graphql"
  const pluginName = `integration-${integrationType}`;
  const plugin = plugins.find((p) => p.name === pluginName);

  if (!plugin) {
    // No plugin registered for this integration type - allow passthrough for now
    // but warn in development
    if (process.env.NODE_ENV === 'development') {
      console.warn(
        `  WARNING: No plugin registered for integration type "${integrationType}". Config will be passed through without validation.`
      );
    }
    return;
  }

  if (!plugin.configSchema) {
    // Plugin exists but doesn't declare a config schema
    if (process.env.NODE_ENV === 'development') {
      console.warn(
        `  WARNING: Plugin "${pluginName}" does not declare a configSchema. Config will be passed through without validation.`
      );
    }
    return;
  }

  // Validate the integration config against the plugin's schema
  const result = plugin.configSchema.safeParse(integration);
  if (!result.success) {
    const details = result.error.issues
      .map((issue) => `    - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    throw new Error(
      `Invalid configuration for integration "${integration.name}" (${integration.type}):\n${details}`
    );
  }
}

/**
 * Validate all integrations in the site config against their respective plugin schemas.
 */
function validateIntegrations(integrations: unknown, plugins: PrebuildPlugin[]): void {
  if (!Array.isArray(integrations)) {
    return;
  }

  for (const integration of integrations) {
    if (integration && typeof integration === 'object') {
      validateIntegrationConfig(integration as Record<string, unknown>, plugins);
    }
  }
}

// -- Config -----------------------------------------------------------------

const IMAGE_EXTENSIONS = new Set([
  '.jpg',
  '.jpeg',
  '.png',
  '.gif',
  '.webp',
  '.svg',
  '.bmp',
  '.ico',
]);

const VIDEO_EXTENSIONS = new Set<string>(VIDEO_EXTENSIONS_ARRAY);

const YAML_EXTENSIONS = new Set(['.yml', '.yaml']);
const COLLECTION_CONFIG_NAMES = new Set(['_collection.yml', '_collection.yaml']);

const LARGE_VIDEO_THRESHOLD_MB = 50;

// -- Font Extraction ------------------------------------------------------------

/**
 * CSS generic font family keywords that should not be loaded from Google Fonts.
 * These are built-in browser fonts and don't need external loading.
 */
const SYSTEM_FONT_KEYWORDS = new Set([
  'serif',
  'sans-serif',
  'monospace',
  'cursive',
  'fantasy',
  'system-ui',
  'ui-serif',
  'ui-sans-serif',
  'ui-monospace',
  'ui-rounded',
  'math',
  'emoji',
  'fangsong',
]);

/**
 * Extract Google Font names from a CSS font-family string.
 *
 * Handles:
 *   - Single fonts: "Roboto"
 *   - Multiple fonts: "JetBrains Mono, monospace"
 *   - Quoted fonts: "Roboto", 'Inter'
 *   - Mixed: "Helvetica Neue", Arial, sans-serif
 *
 * Returns an array of font names that should be loaded from Google Fonts,
 * excluding system/generic font keywords.
 */
export function extractGoogleFontNames(fontFamily: string): string[] {
  if (!fontFamily || typeof fontFamily !== 'string') {
    return [];
  }

  // Split by comma and clean up each font name
  const fonts = fontFamily
    .split(',')
    .map((name) => {
      // Remove quotes and trim whitespace
      return name.replace(/^['"]+|['"]+$/g, '').trim();
    })
    .filter((name) => {
      // Exclude empty names
      if (!name) return false;
      // Exclude system font keywords (case-insensitive)
      return !SYSTEM_FONT_KEYWORDS.has(name.toLowerCase());
    });

  return fonts;
}

/**
 * Generate a Google Fonts URL from an array of font names.
 *
 * Format: https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600&family=Inter:wght@400;600&display=swap
 *
 * Each font includes a default weight of 400 (Regular) since we don't have
 * access to the actual weight specifications at this point.
 */
export function generateGoogleFontsUrl(fonts: string[]): string {
  if (!fonts || fonts.length === 0) {
    return '';
  }

  // Build the family parameter for each font
  // Format: family=Font+Name:wght@400;600&family=Other+Font:wght@400
  const familyParams = fonts
    .map((font) => {
      // Replace spaces with + for URL encoding
      const encodedName = font.replace(/ /g, '+');
      // Default to weight 400 (Regular) since we don't have weight info
      return `family=${encodedName}:wght@400`;
    })
    .join('&');

  return `https://fonts.googleapis.com/css2?${familyParams}&display=swap`;
}

/**
 * Generate link tag objects from a site config for Google Fonts.
 *
 * Returns:
 *   - A preconnect link to fonts.gstatic.com for performance
 *   - A stylesheet link to Google Fonts CSS
 *
 * Reads from customTheme.typography.fontFamily.primary and .secondary
 */
export interface FontLink {
  rel: string;
  href: string;
  crossorigin?: boolean;
}

export function generateFontLinkTags(siteConfig: unknown): FontLink[] {
  const config = siteConfig as Record<string, unknown>;
  const customTheme = config?.customTheme as Record<string, unknown> | undefined;

  if (!customTheme) {
    return [];
  }

  const typography = customTheme?.typography as Record<string, unknown> | undefined;
  if (!typography) {
    return [];
  }

  const fontFamily = typography?.fontFamily as Record<string, string> | undefined;
  if (!fontFamily) {
    return [];
  }

  // Extract fonts from primary and secondary
  const primaryFonts = extractGoogleFontNames(fontFamily?.primary ?? '');
  const secondaryFonts = extractGoogleFontNames(fontFamily?.secondary ?? '');

  // Combine and deduplicate
  const allFonts = [...new Set([...primaryFonts, ...secondaryFonts])];

  if (allFonts.length === 0) {
    return [];
  }

  // Generate Google Fonts URL
  const fontsUrl = generateGoogleFontsUrl(allFonts);

  if (!fontsUrl) {
    return [];
  }

  return [
    // Preconnect for performance
    {
      rel: 'preconnect',
      href: 'https://fonts.gstatic.com',
      crossorigin: true,
    },
    // The actual stylesheet
    {
      rel: 'stylesheet',
      href: fontsUrl,
    },
  ];
}

// -- Helpers ----------------------------------------------------------------

function isImagePath(str: string): boolean {
  return IMAGE_EXTENSIONS.has(path.extname(str).toLowerCase());
}

function isVideoPath(str: string): boolean {
  return VIDEO_EXTENSIONS.has(path.extname(str).toLowerCase());
}

function isColocatablePath(str: string): boolean {
  return isImagePath(str) || isVideoPath(str);
}

function isYamlFile(filename: string): boolean {
  return YAML_EXTENSIONS.has(path.extname(filename).toLowerCase());
}

function isCollectionConfig(filename: string): boolean {
  return COLLECTION_CONFIG_NAMES.has(filename);
}

/** Copy src to dest only if dest is missing or older than src. */
function copyIfNewer(src: string, dest: string, rootDir: string): void {
  fs.mkdirSync(path.dirname(dest), { recursive: true });

  // Security: Reject symlinks to prevent path traversal attacks
  const srcStat = fs.lstatSync(src);
  if (srcStat.isSymbolicLink()) {
    console.warn(`  WARNING: Skipping symlink: ${src}`);
    return;
  }

  if (!fs.existsSync(dest) || fs.statSync(src).mtimeMs > fs.statSync(dest).mtimeMs) {
    fs.copyFileSync(src, dest);
    console.log(`  asset: ${path.relative(rootDir, src)} -> ${path.relative(rootDir, dest)}`);
  }
}

/**
 * Walk any JSON-compatible value, calling rewrite() on every string.
 * Returns a new deep copy with rewritten strings.
 */
function rewritePaths(node: unknown, rewrite: (s: string) => string): unknown {
  if (typeof node === 'string') return rewrite(node);
  if (Array.isArray(node)) return node.map((item) => rewritePaths(item, rewrite));
  if (node !== null && typeof node === 'object') {
    const result: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(node as Record<string, unknown>)) {
      result[k] = rewritePaths(v, rewrite);
    }
    return result;
  }
  return node;
}

/**
 * Process site config (stackwright.yml).
 * Copies images to public/images/config/ and rewrites paths.
 * Handles:
 *   - `./filename.png`  relative with dot-slash
 *   - `filename.png`    bare filename (no slash, not http/data)
 */
function processSiteConfig(config: unknown, rootDir: string, imagesDir: string): unknown {
  return rewritePaths(config, (str) => {
    const isRelativeDot = str.startsWith('./') && isColocatablePath(str);
    const isBareFile =
      !str.includes('/') &&
      !str.startsWith('http') &&
      !str.startsWith('data:') &&
      isColocatablePath(str);

    if (!isRelativeDot && !isBareFile) return str;

    const srcPath = path.resolve(rootDir, isRelativeDot ? str : `./${str}`);
    if (!fs.existsSync(srcPath)) {
      console.warn(`  WARNING: Config image not found: ${srcPath}`);
      return str;
    }

    const filename = path.basename(str);
    const destPath = path.join(imagesDir, 'config', filename);
    copyIfNewer(srcPath, destPath, rootDir);
    return `/images/config/${filename}`;
  });
}

/**
 * Process content YAML (page or collection entry).
 * Copies `./relative` images to imageDestDir and rewrites paths to publicPrefix/filename.
 */
function processPageContent(
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
          `  ⚠️  Large video file: ${path.relative(rootDir, srcPath)} (${fileSizeMB.toFixed(1)} MB). ` +
            `Consider using adaptive streaming (MPEG-DASH/HLS) or a video CDN for files this size.`
        );
      }
    }

    return `${publicPrefix}/${filename}`;
  });
}

interface ContentFile {
  /** URL slug, or null for the root page. */
  slug: string | null;
  filePath: string;
  contentDir: string;
}

/** Recursively find all content.yml / content.yaml files under dir. */
function findContentFiles(dir: string, baseSlug = ''): ContentFile[] {
  const results: ContentFile[] = [];
  if (!fs.existsSync(dir)) return results;

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      const subSlug = baseSlug ? `${baseSlug}/${entry.name}` : entry.name;
      results.push(...findContentFiles(path.join(dir, entry.name), subSlug));
    } else if (entry.name === 'content.yml' || entry.name === 'content.yaml') {
      results.push({
        slug: baseSlug || null,
        filePath: path.join(dir, entry.name),
        contentDir: dir,
      });
    }
  }
  return results;
}

// -- Content type validation ------------------------------------------------
// NOTE: Unknown content type checking is now handled by validatePageContent()

// -- Collections ------------------------------------------------------------

/** Read and validate a _collection.yaml config, or return defaults. */
function loadCollectionConfig(collectionDir: string): CollectionConfig {
  for (const name of COLLECTION_CONFIG_NAMES) {
    const configPath = path.join(collectionDir, name);
    if (fs.existsSync(configPath)) {
      const raw = yaml.load(fs.readFileSync(configPath, 'utf8'));
      const result = collectionConfigSchema.safeParse(raw);
      if (!result.success) {
        const details = result.error.issues
          .map((issue) => `  ${issue.path.join('.')}: ${issue.message}`)
          .join('\n');
        console.warn(`  WARNING: Invalid ${name} in ${collectionDir}:\n${details}`);
        return {};
      }
      return result.data;
    }
  }
  return {};
}

/** Pick fields for the manifest index. */
function pickIndexFields(
  entry: Record<string, unknown>,
  indexFields?: string[]
): Record<string, unknown> {
  const result: Record<string, unknown> = { slug: entry.slug };

  if (indexFields && indexFields.length > 0) {
    for (const field of indexFields) {
      if (field in entry) {
        result[field] = entry[field];
      }
    }
  } else {
    // Default: include all top-level scalar fields and arrays of scalars
    for (const [key, value] of Object.entries(entry)) {
      if (key === 'slug') continue;
      if (value === null || value === undefined) continue;
      const type = typeof value;
      if (type === 'string' || type === 'number' || type === 'boolean') {
        result[key] = value;
      } else if (Array.isArray(value) && value.every((v) => typeof v !== 'object')) {
        result[key] = value;
      }
      // Skip objects, nested arrays -- those belong in the full entry only
    }
  }

  return result;
}

/** Sort entries by a field. Prefix field with `-` for descending. */
function sortEntries(
  entries: Record<string, unknown>[],
  sortField?: string
): Record<string, unknown>[] {
  if (!sortField) {
    // Default: alphabetical by slug
    return [...entries].sort((a, b) => String(a.slug ?? '').localeCompare(String(b.slug ?? '')));
  }

  const descending = sortField.startsWith('-');
  const field = descending ? sortField.slice(1) : sortField;

  return [...entries].sort((a, b) => {
    const aVal = a[field];
    const bVal = b[field];
    if (aVal == null && bVal == null) return 0;
    if (aVal == null) return 1;
    if (bVal == null) return -1;
    const cmp = String(aVal).localeCompare(String(bVal));
    return descending ? -cmp : cmp;
  });
}

/** Format a single meta field value for display in entry pages. */
function formatMetaValue(val: unknown): string {
  if (val == null) return '';
  if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}/.test(val)) {
    try {
      return new Date(val).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return val;
    }
  }
  return `${val}`;
}

/**
 * Recursively resolve `{{fieldName}}` placeholders in a template against entry data.
 *
 * Resolution rules:
 * - `"{{fieldName}}"` as the entire string value → returns the raw field value (preserves type).
 *   Returns `null` if the field is missing (signals "omit this").
 * - `"text {{field1}} more {{field2}}"` → string interpolation.
 *   Arrays are joined with ", ". Missing fields resolve to "".
 *   If no `{{…}}` token resolved to non-empty content, returns `null`.
 * - Arrays: each item is resolved; `null` items are filtered out.
 * - Objects: each value is resolved; keys whose values resolved to `null` are omitted.
 * - Primitives (numbers, booleans): passed through unchanged.
 */
function resolveTemplate(template: unknown, entry: Record<string, unknown>): unknown {
  // Strings: handle {{field}} references
  if (typeof template === 'string') {
    // No field references → literal passthrough
    if (!template.includes('{{')) {
      return template;
    }

    // Entire value is a single field reference → return raw value (preserves arrays, objects, etc.)
    const singleMatch = template.match(/^\{\{(\w+)\}\}$/);
    if (singleMatch) {
      const val = entry[singleMatch[1]];
      return val != null ? val : null;
    }

    // Interpolate multiple/inline references
    let hasResolvedContent = false;
    const result = template.replace(/\{\{(\w+)\}\}/g, (_, field) => {
      const val = entry[field];
      if (val == null || val === '') return '';
      hasResolvedContent = true;
      if (Array.isArray(val)) return val.join(', ');
      return String(val);
    });

    return hasResolvedContent ? result : null;
  }

  // Arrays: resolve each item, filter nulls
  if (Array.isArray(template)) {
    const resolved = template
      .map((item) => resolveTemplate(item, entry))
      .filter((item) => item != null);
    return resolved;
  }

  // Objects: resolve each value, omit keys whose values are null
  if (template != null && typeof template === 'object') {
    const obj = template as Record<string, unknown>;
    const resolved: Record<string, unknown> = {};
    let hadTemplateRef = false;
    let hadResolvedTemplateRef = false;
    for (const [key, value] of Object.entries(obj)) {
      const isTemplateValue = typeof value === 'string' && value.includes('{{');
      if (isTemplateValue) hadTemplateRef = true;
      const resolvedValue = resolveTemplate(value, entry);
      if (resolvedValue != null) {
        resolved[key] = resolvedValue;
        if (isTemplateValue) hadResolvedTemplateRef = true;
      }
    }
    // If ALL template-bearing values resolved to null, the object is content-less — signal removal
    if (hadTemplateRef && !hadResolvedTemplateRef) return null;
    return resolved;
  }

  // Primitives (numbers, booleans, null) pass through
  return template;
}

/**
 * Generate a PageContent JSON file for each collection entry.
 * Returns the list of output paths relative to contentOutDir (without .json extension).
 */
function generateEntryPages(
  collectionName: string,
  entryPage: EntryPageConfig,
  entries: Record<string, unknown>[],
  titleField: string,
  contentOutDir: string
): string[] {
  const generatedPaths: string[] = [];
  const baseDirRelative = entryPage.basePath.replace(/^\//, '').replace(/\/$/, '');
  const outDir = path.join(contentOutDir, baseDirRelative);

  // Security: verify the resolved path stays within contentOutDir
  const resolvedOutDir = path.resolve(outDir);
  const resolvedContentOutDir = path.resolve(contentOutDir);
  if (
    !resolvedOutDir.startsWith(resolvedContentOutDir + path.sep) &&
    resolvedOutDir !== resolvedContentOutDir
  ) {
    throw new Error(
      `Security: entryPage.basePath "${entryPage.basePath}" resolves outside ` +
        `the content output directory. This may be a path traversal attempt.`
    );
  }

  fs.mkdirSync(outDir, { recursive: true });

  const metaFields = entryPage.meta ?? [];
  const backHref = entryPage.basePath.replace(/\/$/, '');

  for (const entry of entries) {
    const slug = String(entry.slug ?? '');
    if (!slug) continue;

    let pageContent: PageContent;

    if (entryPage.template) {
      // Template-based: resolve {{field}} placeholders against entry data
      const resolvedContent = resolveTemplate(entryPage.template, entry);
      pageContent = { content: resolvedContent as PageContent['content'] };
    } else {
      // Default template (legacy body/meta/tags config)
      const titleValue = String(entry[titleField] || slug);
      const bodyContent = entryPage.body ? entry[entryPage.body] : undefined;

      // Build meta line: configured meta fields + tags
      const metaParts = metaFields.map((field) => formatMetaValue(entry[field])).filter(Boolean);

      if (entryPage.tags) {
        const tagsVal = entry[entryPage.tags];
        if (Array.isArray(tagsVal) && tagsVal.length > 0) {
          metaParts.push(tagsVal.join(', '));
        } else if (tagsVal != null && String(tagsVal)) {
          metaParts.push(String(tagsVal));
        }
      }

      const metaLine = metaParts.join(' \u00b7 ');

      const textBlocks: Array<{ text: string; textSize: TypographyVariant }> = [];
      if (metaLine) {
        textBlocks.push({ text: metaLine, textSize: 'subtitle2' });
      }
      if (bodyContent) {
        textBlocks.push({ text: String(bodyContent), textSize: 'body1' });
      }

      pageContent = {
        content: {
          content_items: [
            {
              type: 'main' as const,
              label: `${collectionName}-entry-${slug}`,
              heading: {
                text: titleValue,
                textSize: 'h3' as const,
                textColor: 'secondary',
              },
              textBlocks,
              buttons: [
                {
                  text: '\u2190 Back',
                  textSize: 'body1' as const,
                  variant: 'text' as const,
                  href: backHref,
                },
              ],
            },
          ],
        },
      } satisfies PageContent;
    }

    const outFile = path.join(outDir, `${slug}.json`);

    // Security: verify entry file path stays within outDir
    const resolvedOutFile = path.resolve(outFile);
    if (!resolvedOutFile.startsWith(resolvedOutDir + path.sep)) {
      console.warn(`  WARNING: Skipping entry "${slug}" — resolved path escapes output directory.`);
      continue;
    }

    fs.writeFileSync(outFile, JSON.stringify(pageContent, null, 2));

    const relativePath = baseDirRelative ? `${baseDirRelative}/${slug}` : slug;
    generatedPaths.push(relativePath);
  }

  return generatedPaths;
}

interface CollectionProcessResult {
  indexes: Map<string, Record<string, unknown>[]>;
  entryPagePaths: string[];
}

function processCollections(
  contentDir: string,
  contentOutDir: string,
  imagesDir: string,
  rootDir: string
): CollectionProcessResult {
  const collectionIndexes = new Map<string, Record<string, unknown>[]>();
  const allEntryPagePaths: string[] = [];
  const collectionsDirs = fs
    .readdirSync(contentDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory());

  if (collectionsDirs.length === 0) return { indexes: collectionIndexes, entryPagePaths: [] };

  console.log('\nProcessing collections...');

  for (const dir of collectionsDirs) {
    const collectionName = dir.name;
    const collectionDir = path.join(contentDir, collectionName);
    const collectionOutDir = path.join(contentOutDir, 'collections', collectionName);

    fs.mkdirSync(collectionOutDir, { recursive: true });

    const config = loadCollectionConfig(collectionDir);

    // Find all YAML entry files (skip _collection.yaml)
    const entryFiles = fs
      .readdirSync(collectionDir)
      .filter((f) => isYamlFile(f) && !isCollectionConfig(f));

    if (entryFiles.length === 0) {
      console.log(`  - ${collectionName}: 0 entries`);
      continue;
    }

    const allEntries: Record<string, unknown>[] = [];

    for (const entryFile of entryFiles) {
      const slug = path.basename(entryFile, path.extname(entryFile));
      const entryPath = path.join(collectionDir, entryFile);

      let rawEntry: unknown;
      try {
        rawEntry = yaml.load(fs.readFileSync(entryPath, 'utf8'));
      } catch (err) {
        console.warn(`  WARNING: Failed to parse ${entryPath}: ${(err as Error).message}`);
        continue;
      }

      if (rawEntry === null || typeof rawEntry !== 'object' || Array.isArray(rawEntry)) {
        console.warn(`  WARNING: Entry ${entryPath} is not a YAML object, skipping.`);
        continue;
      }

      const entry = { ...(rawEntry as Record<string, unknown>), slug };

      // Rewrite co-located image paths
      const imageDestDir = path.join(imagesDir, 'collections', collectionName, slug);
      const publicPrefix = `/images/collections/${collectionName}/${slug}`;
      const processedEntry = processPageContent(
        entry,
        collectionDir,
        imageDestDir,
        publicPrefix,
        rootDir
      ) as Record<string, unknown>;

      // Write full entry JSON
      fs.writeFileSync(
        path.join(collectionOutDir, `${slug}.json`),
        JSON.stringify(processedEntry, null, 2)
      );

      allEntries.push(processedEntry);
    }

    // Build and write the manifest index
    const indexEntries = allEntries.map((entry) => pickIndexFields(entry, config.indexFields));
    const sortedIndex = sortEntries(indexEntries, config.sort);

    fs.writeFileSync(
      path.join(collectionOutDir, '_index.json'),
      JSON.stringify(sortedIndex, null, 2)
    );

    collectionIndexes.set(collectionName, sortedIndex);

    console.log(`  OK ${collectionName}: ${allEntries.length} entries`);

    // Generate entry pages if entryPage config is present
    if (config.entryPage) {
      if (!config.entryPage.template) {
        console.log(
          `  ℹ  "${collectionName}" is using the default entry page template.\n` +
            `     Define a custom template in _collection.yaml for full control over layout.`
        );
      }
      const titleField = config.indexFields?.[0] ?? 'title';
      const entryPaths = generateEntryPages(
        collectionName,
        config.entryPage,
        allEntries,
        titleField,
        contentOutDir
      );
      allEntryPagePaths.push(...entryPaths);
      console.log(`  OK ${collectionName}: ${entryPaths.length} entry pages generated`);
    }
  }

  return { indexes: collectionIndexes, entryPagePaths: allEntryPagePaths };
}

/**
 * Walk page content items and inject `_entries` into any `collection_list` blocks.
 * This makes collection data available at render time with zero async overhead.
 */
function injectCollectionEntries(
  pageContent: unknown,
  collectionIndexes: Map<string, Record<string, unknown>[]>
): unknown {
  if (pageContent === null || typeof pageContent !== 'object') return pageContent;
  if (Array.isArray(pageContent)) {
    return pageContent.map((item) => injectCollectionEntries(item, collectionIndexes));
  }

  const obj = pageContent as Record<string, unknown>;

  // Flat content item with type: 'collection_list' — inject _entries directly
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

  // Recurse into all object values (handles content_items arrays, nested grids, etc.)
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    result[key] = injectCollectionEntries(value, collectionIndexes);
  }
  return result;
}

// ---------------------------------------------------------------------------
// Content format normalization
//
// Pro content items may be authored in YAML mapping-key-as-type format:
//   - page_header:
//       title: "Hello"
//
// This normalizes them to the OSS type-field format:
//   - type: page_header
//     title: "Hello"
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

  // Already in OSS format (has 'type' string field) — just recurse into nested items
  if (typeof obj.type === 'string') {
    return normalizeNestedContent(obj);
  }

  // Check for mapping-key format: exactly one key whose value is a plain object
  const keys = Object.keys(obj);
  if (keys.length === 1) {
    const [typeKey] = keys;
    const value = obj[typeKey];
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      const normalized: Record<string, unknown> = {
        type: typeKey,
        ...(value as Record<string, unknown>),
      };
      return normalizeNestedContent(normalized);
    }
  }

  return obj;
}

function normalizePageContent(rawContent: unknown): unknown {
  if (!rawContent || typeof rawContent !== 'object') return rawContent;
  const page = rawContent as Record<string, unknown>;
  const content = page.content as Record<string, unknown> | undefined;
  if (!content) return rawContent;
  const items = content.content_items;
  if (!Array.isArray(items)) return rawContent;
  return {
    ...page,
    content: {
      ...content,
      content_items: items.map(normalizeContentItem),
    },
  };
}

// -- Plugin Execution -------------------------------------------------------

/**
 * Execute a plugin hook with error handling
 */
async function executePluginHook(
  plugin: PrebuildPlugin,
  hook: 'beforeBuild' | 'afterBuild',
  context: PrebuildPluginContext
): Promise<void> {
  const hookFn = plugin[hook];
  if (!hookFn) return;

  try {
    console.log(`  Running ${plugin.name} (${hook})...`);
    await Promise.resolve(hookFn(context));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Plugin "${plugin.name}" failed during ${hook}: ${message}`);
  }
}

/**
 * Execute all plugins for a given hook
 */
async function executePlugins(
  plugins: PrebuildPlugin[],
  hook: 'beforeBuild' | 'afterBuild',
  context: PrebuildPluginContext
): Promise<void> {
  for (const plugin of plugins) {
    await executePluginHook(plugin, hook, context);
  }
}

// -- Main -------------------------------------------------------------------

export async function runPrebuild(options?: string | PrebuildOptions): Promise<void> {
  // Backward compatibility: support old API with string parameter
  const projectRoot =
    typeof options === 'string' ? options : (options?.projectRoot ?? process.cwd());
  const plugins = typeof options === 'object' && options !== null ? (options.plugins ?? []) : [];

  // Collect extra content schemas and known type keys from all plugins
  const extraContentSchemas = plugins.flatMap((p) => p.contentItemSchemas ?? []);
  const pluginKnownTypes = plugins.flatMap((p) => p.knownContentTypeKeys ?? []);

  const pagesDir = path.join(projectRoot, 'pages');
  const publicDir = path.join(projectRoot, 'public');
  const imagesDir = path.join(publicDir, 'images');
  const contentOutDir = path.join(publicDir, 'stackwright-content');

  const siteConfigCandidates = [
    path.join(projectRoot, 'stackwright.yml'),
    path.join(projectRoot, 'stackwright.yaml'),
  ];

  console.log('Stackwright prebuild starting...');

  fs.mkdirSync(contentOutDir, { recursive: true });
  fs.mkdirSync(imagesDir, { recursive: true });

  // 1. Process site config
  const siteConfigFile = siteConfigCandidates.find((p) => fs.existsSync(p));
  if (!siteConfigFile) {
    throw new Error(`Site config not found. Expected stackwright.yml in: ${projectRoot}`);
  }

  console.log('\nProcessing site config...');
  const rawConfig = yaml.load(fs.readFileSync(siteConfigFile, 'utf8'));

  const siteValidation = siteConfigSchema.safeParse(rawConfig);
  if (!siteValidation.success) {
    const details = siteValidation.error.issues
      .map((issue) => {
        const field = issue.path.length > 0 ? issue.path.join('.') : '(root)';
        return `  ${field}: ${issue.message}`;
      })
      .join('\n');
    throw new Error(`stackwright.yml is invalid:\n${details}`);
  }

  const processedConfig = processSiteConfig(rawConfig, projectRoot, imagesDir);

  // Resolve environment variable references in integrations
  const configWithEnvResolved = applyEnvVarResolution(processedConfig);
  console.log('  ✓ Resolved environment variable references in integrations');

  // Validate integration configs against plugin schemas (if plugins are registered)
  if (plugins.length > 0) {
    const integrations = (configWithEnvResolved as Record<string, unknown>).integrations;
    if (Array.isArray(integrations)) {
      validateIntegrations(integrations, plugins);
      console.log('  ✓ Validated integration configurations against plugin schemas');
    }
  }

  fs.writeFileSync(
    path.join(contentOutDir, '_site.json'),
    JSON.stringify(configWithEnvResolved, null, 2)
  );
  console.log('  OK _site.json');

  // 1b. Generate and write font links for Google Fonts
  const fontLinks = generateFontLinkTags(configWithEnvResolved);
  if (fontLinks.length > 0) {
    fs.writeFileSync(
      path.join(contentOutDir, '_font-links.json'),
      JSON.stringify({ links: fontLinks }, null, 2)
    );
    console.log('  OK _font-links.json');
  }

  // Run beforeBuild plugin hooks
  if (plugins.length > 0) {
    console.log('\nRunning beforeBuild plugins...');
    const generatedDir = path.join(projectRoot, 'src', 'generated');
    const pluginContext: PrebuildPluginContext = {
      projectRoot,
      siteConfig: configWithEnvResolved as Record<string, unknown>,
      contentOutDir,
      imagesDir,
      generatedDir,
    };
    await executePlugins(plugins, 'beforeBuild', pluginContext);
  }

  // 2. Process collections (before pages, so collection_list can be expanded)
  const contentDir = path.join(projectRoot, 'content');
  let collectionIndexes = new Map<string, Record<string, unknown>[]>();
  let entryPagePaths: string[] = [];
  if (fs.existsSync(contentDir)) {
    const result = processCollections(contentDir, contentOutDir, imagesDir, projectRoot);
    collectionIndexes = result.indexes;
    entryPagePaths = result.entryPagePaths;
  }

  // 3. Process page content files (collection_list entries are injected here)
  console.log('\nProcessing pages...');
  const contentFiles = findContentFiles(pagesDir);

  if (contentFiles.length === 0) {
    console.warn('  WARNING: No content.yml files found in pages/');
  }

  for (const { slug, filePath, contentDir } of contentFiles) {
    const label = slug ?? '(root)';
    const rawContent = yaml.load(fs.readFileSync(filePath, 'utf8'));

    // Normalize mapping-key format to type-field format (backward compat for pro content)
    const normalizedContent = normalizePageContent(rawContent);

    // Validate using shared validator — extended with plugin schemas if provided
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
      throw new Error(output);
    }

    const slugDir = slug ?? '_root';
    const imageDestDir = path.join(imagesDir, slugDir);
    const publicPrefix = `/images/${slugDir}`;

    const processedContent = processPageContent(
      normalizedContent,
      contentDir,
      imageDestDir,
      publicPrefix,
      projectRoot
    );

    // Expand collection_list references with actual entries
    const expandedContent = injectCollectionEntries(processedContent, collectionIndexes);

    const outFile = slug ? `${slug}.json` : '_root.json';
    fs.writeFileSync(path.join(contentOutDir, outFile), JSON.stringify(expandedContent, null, 2));
    console.log(`  OK ${outFile}  (${label})`);
  }

  // Warn about collisions between generated entry pages and manually-authored pages
  if (entryPagePaths.length > 0) {
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

  // Run afterBuild plugin hooks
  if (plugins.length > 0) {
    console.log('\nRunning afterBuild plugins...');
    const generatedDir = path.join(projectRoot, 'src', 'generated');
    const pluginContext: PrebuildPluginContext = {
      projectRoot,
      siteConfig: configWithEnvResolved as Record<string, unknown>,
      contentOutDir,
      imagesDir,
      generatedDir,
    };
    await executePlugins(plugins, 'afterBuild', pluginContext);
  }
  // 4. Build search index from all processed pages
  const searchIndexPath = path.join(contentOutDir, 'search-index.json');
  try {
    const { buildSearchIndex } = require('./build-searchIndex');
    const entries = buildSearchIndex(contentOutDir, searchIndexPath);
    console.log('\n  [OK] Search index: ' + entries.length + ' pages indexed');
  } catch (err) {
    console.warn('\n  [WARN] Search index generation skipped: ' + (err as Error).message);
  }

  // 5. Generate SBOM (unless --no-sbom flag is set)
  if (!process.argv.includes('--no-sbom')) {
    try {
      const { createSBOM } = await import('@stackwright/sbom-generator');
      const sbom = await createSBOM({
        projectRoot,
        formats: ['spdx', 'cyclonedx', 'build-manifest'],
        includeDevDependencies: false,
        includePeerDependencies: true,
        outputDir: path.join(projectRoot, '.stackwright', 'sbom'),
      });
      await sbom.writeTo(projectRoot);
      console.log('\n  [OK] SBOM generated: .stackwright/sbom/');
    } catch (error) {
      // SBOM generation failure should not fail the build
      console.warn('\n  [WARN] SBOM generation failed (non-critical): ' + (error as Error).message);
    }
  }

  console.log('\nStackwright prebuild complete.\n');
}

// Run when executed directly as a CLI (not when required as a module)
if (require.main === module) {
  const watchMode = process.argv.includes('--watch');
  const noSBOM = process.argv.includes('--no-sbom');

  if (noSBOM) {
    console.log('[INFO] SBOM generation skipped (--no-sbom flag)');
  }

  if (watchMode) {
    // Dynamic import to avoid loading watch code in non-watch mode
    const { runWatch } = require('./watch');
    runWatch();
  } else {
    (async () => {
      try {
        await runPrebuild();
      } catch (err) {
        console.error(`ERROR: ${(err as Error).message}`);
        process.exit(1);
      }
    })();
  }
}
