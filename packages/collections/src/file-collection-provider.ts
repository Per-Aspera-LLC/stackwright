import fs from 'fs';
import path from 'path';
import type {
  CollectionProvider,
  CollectionEntry,
  CollectionListOptions,
  CollectionListResult,
} from './types';

/**
 * File-backed CollectionProvider.
 *
 * Reads from the prebuild output in `public/stackwright-content/collections/`.
 * Each collection is a subdirectory containing:
 *   - `_index.json`    — sorted manifest of entries (subset of fields)
 *   - `<slug>.json`    — full entry data
 *
 * This provider is designed for use in `getStaticProps` / `generateStaticParams`
 * at build time. All reads hit the local filesystem — no network, no API keys.
 */
export class FileCollectionProvider implements CollectionProvider {
  private basePath: string;

  constructor(basePath?: string) {
    this.basePath =
      basePath ?? path.join(process.cwd(), 'public', 'stackwright-content', 'collections');
  }

  async collections(): Promise<string[]> {
    if (!fs.existsSync(this.basePath)) return [];

    return fs
      .readdirSync(this.basePath, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name);
  }

  async list(
    collection: string,
    opts: CollectionListOptions = {}
  ): Promise<CollectionListResult> {
    const indexPath = path.join(this.basePath, collection, '_index.json');

    if (!fs.existsSync(indexPath)) {
      return { entries: [], total: 0 };
    }

    let entries: CollectionEntry[] = JSON.parse(fs.readFileSync(indexPath, 'utf8'));

    // Filter — exact match on specified fields
    if (opts.filter) {
      for (const [field, value] of Object.entries(opts.filter)) {
        entries = entries.filter((entry) => {
          const entryValue = entry[field];
          // Support filtering on array fields (e.g. tags): match if array contains value
          if (Array.isArray(entryValue)) {
            return entryValue.includes(value);
          }
          return entryValue === value;
        });
      }
    }

    // Sort — override the manifest's default sort if opts.sort is provided
    if (opts.sort) {
      const descending = opts.sort.startsWith('-');
      const field = descending ? opts.sort.slice(1) : opts.sort;

      entries = [...entries].sort((a, b) => {
        const aVal = a[field];
        const bVal = b[field];

        if (aVal == null && bVal == null) return 0;
        if (aVal == null) return 1;
        if (bVal == null) return -1;

        const cmp = String(aVal).localeCompare(String(bVal));
        return descending ? -cmp : cmp;
      });
    }

    const total = entries.length;

    // Offset
    if (opts.offset && opts.offset > 0) {
      entries = entries.slice(opts.offset);
    }

    // Limit
    if (opts.limit && opts.limit > 0) {
      entries = entries.slice(0, opts.limit);
    }

    return { entries, total };
  }

  async get(collection: string, slug: string): Promise<CollectionEntry | null> {
    // Sanitize slug to prevent path traversal
    const safeSlug = path.basename(slug);
    const entryPath = path.join(this.basePath, collection, `${safeSlug}.json`);

    if (!fs.existsSync(entryPath)) {
      return null;
    }

    return JSON.parse(fs.readFileSync(entryPath, 'utf8'));
  }
}
