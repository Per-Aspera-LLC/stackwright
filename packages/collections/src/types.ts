/**
 * CollectionProvider — the core abstraction for Stackwright collections.
 *
 * Every data backend (file-based, S3, Contentful, Sanity, OpenAPI, etc.)
 * implements this interface. Swapping backends is a one-line registration
 * change; the YAML content and rendering layer never change.
 */

export interface CollectionEntry {
  slug: string;
  [key: string]: unknown;
}

export interface CollectionListOptions {
  /** Maximum number of entries to return. */
  limit?: number;
  /** Number of entries to skip (for pagination). */
  offset?: number;
  /** Field name to sort by. Prefix with `-` for descending (e.g. `-date`). */
  sort?: string;
  /** Exact-match filters. Keys are field names, values are expected values. */
  filter?: Record<string, unknown>;
}

export interface CollectionListResult {
  entries: CollectionEntry[];
  /** Total matching entries before limit/offset — enables pagination. */
  total: number;
}

export interface CollectionProvider {
  /** List entries in a collection with optional filtering, sorting, and pagination. */
  list(collection: string, opts?: CollectionListOptions): Promise<CollectionListResult>;

  /** Get a single entry by slug. Returns null if not found. */
  get(collection: string, slug: string): Promise<CollectionEntry | null>;

  /** List available collection names. */
  collections(): Promise<string[]>;
}
