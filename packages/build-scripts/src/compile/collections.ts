import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import { collectionConfigSchema } from '@stackwright/types';
import type {
  CollectionConfig,
  EntryPageConfig,
  PageContent,
  TypographyVariant,
} from '@stackwright/types';
import { copyIfNewer, rewritePaths, isColocatablePath } from './path-utils';
import type { CompileContext } from './context';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const YAML_EXTENSIONS = new Set(['.yml', '.yaml']);
const COLLECTION_CONFIG_NAMES = new Set(['_collection.yml', '_collection.yaml']);

function isYamlFile(filename: string): boolean {
  return YAML_EXTENSIONS.has(path.extname(filename).toLowerCase());
}
function isCollectionConfig(filename: string): boolean {
  return COLLECTION_CONFIG_NAMES.has(filename);
}

// ---------------------------------------------------------------------------
// Collection config loader
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Index helpers
// ---------------------------------------------------------------------------

function pickIndexFields(
  entry: Record<string, unknown>,
  indexFields?: string[]
): Record<string, unknown> {
  const result: Record<string, unknown> = { slug: entry.slug };

  if (indexFields && indexFields.length > 0) {
    for (const field of indexFields) {
      if (field in entry) result[field] = entry[field];
    }
  } else {
    for (const [key, value] of Object.entries(entry)) {
      if (key === 'slug') continue;
      if (value === null || value === undefined) continue;
      const type = typeof value;
      if (type === 'string' || type === 'number' || type === 'boolean') {
        result[key] = value;
      } else if (Array.isArray(value) && value.every((v) => typeof v !== 'object')) {
        result[key] = value;
      }
    }
  }

  return result;
}

function sortEntries(
  entries: Record<string, unknown>[],
  sortField?: string
): Record<string, unknown>[] {
  if (!sortField) {
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

// ---------------------------------------------------------------------------
// Entry page generation
// ---------------------------------------------------------------------------

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
 * Resolve `{{fieldName}}` placeholders in a template against entry data.
 *
 * - Pure `"{{field}}"` -> returns the raw field value (preserves type).
 * - Inline `"text {{field}}"` -> string interpolation; returns null if nothing resolved.
 * - Arrays -> each item resolved, nulls filtered.
 * - Objects -> each value resolved, null-valued keys omitted.
 * - Primitives -> pass through unchanged.
 */
function resolveTemplate(template: unknown, entry: Record<string, unknown>): unknown {
  if (typeof template === 'string') {
    if (!template.includes('{{')) return template;

    const singleMatch = template.match(/^\{\{(\w+)\}\}$/);
    if (singleMatch) {
      const val = entry[singleMatch[1]];
      return val != null ? val : null;
    }

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

  if (Array.isArray(template)) {
    return template.map((item) => resolveTemplate(item, entry)).filter((item) => item != null);
  }

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
    if (hadTemplateRef && !hadResolvedTemplateRef) return null;
    return resolved;
  }

  return template;
}

export function generateEntryPages(
  collectionName: string,
  entryPage: EntryPageConfig,
  entries: Record<string, unknown>[],
  titleField: string,
  contentOutDir: string
): string[] {
  const generatedPaths: string[] = [];
  const baseDirRelative = entryPage.basePath.replace(/^\//, '').replace(/\/$/, '');
  const outDir = path.join(contentOutDir, baseDirRelative);

  // Security: verify resolved path stays within contentOutDir
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
      const resolvedContent = resolveTemplate(entryPage.template, entry);
      pageContent = { content: resolvedContent as PageContent['content'] };
    } else {
      const titleValue = String(entry[titleField] || slug);
      const bodyContent = entryPage.body ? entry[entryPage.body] : undefined;
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
      if (metaLine) textBlocks.push({ text: metaLine, textSize: 'subtitle2' });
      if (bodyContent) textBlocks.push({ text: String(bodyContent), textSize: 'body1' });

      pageContent = {
        content: {
          content_items: [
            {
              type: 'main' as const,
              label: `${collectionName}-entry-${slug}`,
              heading: { text: titleValue, textSize: 'h3' as const, textColor: 'secondary' },
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
    const resolvedOutFile = path.resolve(outFile);
    if (!resolvedOutFile.startsWith(resolvedOutDir + path.sep)) {
      console.warn(
        `  WARNING: Skipping entry "${slug}" -- resolved path escapes output directory.`
      );
      continue;
    }

    fs.writeFileSync(outFile, JSON.stringify(pageContent, null, 2));
    const relativePath = baseDirRelative ? `${baseDirRelative}/${slug}` : slug;
    generatedPaths.push(relativePath);
  }

  return generatedPaths;
}

// ---------------------------------------------------------------------------
// processCollections (internal result shape)
// ---------------------------------------------------------------------------

export interface FileCollectionsResult {
  /** Map of collection name -> sorted index entries. */
  indexes: Map<string, Record<string, unknown>[]>;
  /** Relative paths of generated entry pages. */
  entryPagePaths: string[];
}

// ---------------------------------------------------------------------------
// processPageContent (local copy for collection entries)
// ---------------------------------------------------------------------------

function processCollectionEntryContent(
  content: unknown,
  collectionDir: string,
  imageDestDir: string,
  publicPrefix: string,
  rootDir: string
): unknown {
  return rewritePaths(content, (str) => {
    if (!str.startsWith('./') || !isColocatablePath(str)) return str;

    const srcPath = path.resolve(collectionDir, str);
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

// ---------------------------------------------------------------------------
// compileFileCollections — orchestrator
// ---------------------------------------------------------------------------

/**
 * Compile OSS file-based collections from the `content/` directory.
 *
 * Named `compileFileCollections` to distinguish from the upcoming Pro
 * `compileCollections` (live data, Bead 2).
 *
 * Reads `content/<name>/*.yml` entries, writes:
 *   - `collections/<name>/<slug>.json` — full entry data
 *   - `collections/<name>/_index.json` — sorted manifest
 *   - Entry page JSONs (if `_collection.yaml` configures `entryPage`)
 *
 * Returns collection indexes so `compilePages` can inject `collection_list` entries.
 */
/**
 * Synchronous: all operations are YAML parsing and file writes.
 */
export function compileFileCollections(ctx: CompileContext): FileCollectionsResult {
  const { projectRoot, contentOutDir, imagesDir } = ctx;
  const contentDir = path.join(projectRoot, 'content');

  if (!fs.existsSync(contentDir)) {
    return { indexes: new Map(), entryPagePaths: [] };
  }

  const collectionIndexes = new Map<string, Record<string, unknown>[]>();
  const allEntryPagePaths: string[] = [];
  const collectionsDirs = fs
    .readdirSync(contentDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory());

  if (collectionsDirs.length === 0) {
    return { indexes: collectionIndexes, entryPagePaths: [] };
  }

  console.log('\nProcessing collections...');

  for (const dir of collectionsDirs) {
    const collectionName = dir.name;
    const collectionDir = path.join(contentDir, collectionName);
    const collectionOutDir = path.join(contentOutDir, 'collections', collectionName);

    fs.mkdirSync(collectionOutDir, { recursive: true });

    const config = loadCollectionConfig(collectionDir);

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

      const imageDestDir = path.join(imagesDir, 'collections', collectionName, slug);
      const publicPrefix = `/images/collections/${collectionName}/${slug}`;
      const processedEntry = processCollectionEntryContent(
        entry,
        collectionDir,
        imageDestDir,
        publicPrefix,
        projectRoot
      ) as Record<string, unknown>;

      fs.writeFileSync(
        path.join(collectionOutDir, `${slug}.json`),
        JSON.stringify(processedEntry, null, 2)
      );

      allEntries.push(processedEntry);
    }

    const indexEntries = allEntries.map((entry) => pickIndexFields(entry, config.indexFields));
    const sortedIndex = sortEntries(indexEntries, config.sort);

    fs.writeFileSync(
      path.join(collectionOutDir, '_index.json'),
      JSON.stringify(sortedIndex, null, 2)
    );

    collectionIndexes.set(collectionName, sortedIndex);
    console.log(`  OK ${collectionName}: ${allEntries.length} entries`);

    if (config.entryPage) {
      if (!config.entryPage.template) {
        console.log(
          `  [INFO] "${collectionName}" is using the default entry page template.\n` +
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
