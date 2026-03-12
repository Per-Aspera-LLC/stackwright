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
 *
 * Images are copied to public/images/ with directory structure preserved.
 */

import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import {
  siteConfigSchema,
  pageContentSchema,
  KNOWN_CONTENT_TYPE_KEYS,
  collectionConfigSchema,
} from '@stackwright/types';
import type { CollectionConfig } from '@stackwright/types';

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

const YAML_EXTENSIONS = new Set(['.yml', '.yaml']);
const COLLECTION_CONFIG_NAMES = new Set(['_collection.yml', '_collection.yaml']);

// -- Helpers ----------------------------------------------------------------

function isImagePath(str: string): boolean {
  return IMAGE_EXTENSIONS.has(path.extname(str).toLowerCase());
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
  if (!fs.existsSync(dest) || fs.statSync(src).mtimeMs > fs.statSync(dest).mtimeMs) {
    fs.copyFileSync(src, dest);
    console.log(`  image: ${path.relative(rootDir, src)} -> ${path.relative(rootDir, dest)}`);
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
    const isRelativeDot = str.startsWith('./') && isImagePath(str);
    const isBareFile =
      !str.includes('/') && !str.startsWith('http') && !str.startsWith('data:') && isImagePath(str);

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
    if (!str.startsWith('./') || !isImagePath(str)) return str;

    const srcPath = path.resolve(contentDir, str);
    if (!fs.existsSync(srcPath)) {
      console.warn(`  WARNING: Content image not found: ${srcPath}`);
      return str;
    }

    const filename = path.basename(str);
    const destPath = path.join(imageDestDir, filename);
    copyIfNewer(srcPath, destPath, rootDir);
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

const knownContentKeys = new Set<string>(KNOWN_CONTENT_TYPE_KEYS);

/**
 * Inspect raw (pre-Zod-parse) content items for unrecognized content type keys.
 * Zod's default `.strip()` silently removes unknown keys, so a typo like
 * `feture_list` would pass validation but render as an invisible gap.
 * This check catches those typos at build time.
 */
function warnUnknownContentKeys(contentItems: Record<string, unknown>[], filePath: string): void {
  for (let i = 0; i < contentItems.length; i++) {
    const item = contentItems[i];
    const keys = Object.keys(item);
    const unknownKeys = keys.filter((k) => !knownContentKeys.has(k));

    for (const key of unknownKeys) {
      console.warn(
        `  WARNING: Unknown content type "${key}" in ${filePath} (content_items[${i}]). ` +
          `Known types: ${KNOWN_CONTENT_TYPE_KEYS.join(', ')}`
      );
    }

    if (keys.length > 0 && keys.every((k) => !knownContentKeys.has(k))) {
      console.warn(
        `  WARNING: content_items[${i}] in ${filePath} has no recognized content type and will not render.`
      );
    }
  }
}

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

function processCollections(
  contentDir: string,
  contentOutDir: string,
  imagesDir: string,
  rootDir: string
): Map<string, Record<string, unknown>[]> {
  const collectionIndexes = new Map<string, Record<string, unknown>[]>();
  const collectionsDirs = fs
    .readdirSync(contentDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory());

  if (collectionsDirs.length === 0) return collectionIndexes;

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

      const entry = { slug, ...(rawEntry as Record<string, unknown>) };

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
  }

  return collectionIndexes;
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
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (key === 'collection_list' && value !== null && typeof value === 'object') {
      const listConfig = value as Record<string, unknown>;
      const source = listConfig.source as string | undefined;
      if (source && collectionIndexes.has(source)) {
        result[key] = { ...listConfig, _entries: collectionIndexes.get(source) };
      } else {
        if (source) {
          console.warn(`  WARNING: collection_list references unknown collection "${source}".`);
        }
        result[key] = value;
      }
    } else {
      result[key] = injectCollectionEntries(value, collectionIndexes);
    }
  }

  return result;
}

// -- Main -------------------------------------------------------------------

export function runPrebuild(projectRoot = process.cwd()): void {
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
  fs.writeFileSync(
    path.join(contentOutDir, '_site.json'),
    JSON.stringify(processedConfig, null, 2)
  );
  console.log('  OK _site.json');

  // 2. Process collections (before pages, so collection_list can be expanded)
  const contentDir = path.join(projectRoot, 'content');
  let collectionIndexes = new Map<string, Record<string, unknown>[]>();
  if (fs.existsSync(contentDir)) {
    collectionIndexes = processCollections(contentDir, contentOutDir, imagesDir, projectRoot);
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

    const pageValidation = pageContentSchema.safeParse(rawContent);
    if (!pageValidation.success) {
      const details = pageValidation.error.issues
        .map((issue) => {
          const field = issue.path.length > 0 ? issue.path.join('.') : '(root)';
          return `  ${field}: ${issue.message}`;
        })
        .join('\n');
      throw new Error(`Invalid content: ${filePath}\n${details}`);
    }

    // Warn about unknown content type keys in the raw YAML (before Zod strips them)
    const rawItems = (rawContent as any)?.content?.content_items;
    if (Array.isArray(rawItems)) {
      warnUnknownContentKeys(rawItems, filePath);
    }

    const slugDir = slug ?? '_root';
    const imageDestDir = path.join(imagesDir, slugDir);
    const publicPrefix = `/images/${slugDir}`;

    const processedContent = processPageContent(
      rawContent,
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

  console.log('\nStackwright prebuild complete.\n');
}

// Run when executed directly as a CLI (not when required as a module)
if (require.main === module) {
  const watchMode = process.argv.includes('--watch');

  if (watchMode) {
    // Dynamic import to avoid loading watch code in non-watch mode
    const { runWatch } = require('./watch');
    runWatch();
  } else {
    try {
      runPrebuild();
    } catch (err) {
      console.error(`ERROR: ${(err as Error).message}`);
      process.exit(1);
    }
  }
}
