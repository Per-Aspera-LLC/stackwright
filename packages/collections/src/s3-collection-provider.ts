/**
 * S3CollectionProvider
 *
 * Reads Stackwright collections from an S3 bucket. Collections must be stored
 * in the same JSON format as the file-backed provider:
 *   - `<prefix>/<collection>/_index.json`  — sorted manifest
 *   - `<prefix>/<collection>/<slug>.json`  — full entry
 *
 * `@aws-sdk/client-s3` is a peerDependency — it must be installed by the
 * consumer. This keeps @stackwright/collections free of runtime AWS deps for
 * projects that only use the file-backed provider.
 */

// Type-only import so the peer dep is never bundled.
import type { S3Client, GetObjectCommandOutput } from '@aws-sdk/client-s3';

import type {
  CollectionProvider,
  CollectionEntry,
  CollectionListOptions,
  CollectionListResult,
} from '@stackwright/types';

export interface S3CollectionProviderOptions {
  /** S3 bucket name. */
  bucket: string;
  /** Key prefix for collection data (default: `'stackwright-content/collections'`). */
  prefix?: string;
  /** Pre-configured S3Client. If omitted a default client is created on first use. */
  client?: S3Client;
}

/**
 * S3-backed CollectionProvider.
 *
 * Reads from an S3 bucket where collections are stored in the same JSON format
 * as the file-backed provider. Applies filter/sort/offset/limit in memory after
 * fetching the manifest — no secondary index or query layer required.
 */
export class S3CollectionProvider implements CollectionProvider {
  private readonly bucket: string;
  private readonly prefix: string;
  private clientInstance: S3Client | undefined;
  private readonly clientOption: S3Client | undefined;

  constructor({
    bucket,
    prefix = 'stackwright-content/collections',
    client,
  }: S3CollectionProviderOptions) {
    this.bucket = bucket;
    this.prefix = prefix.replace(/\/$/, ''); // strip trailing slash
    this.clientOption = client;
  }

  // ---------------------------------------------------------------------------
  // CollectionProvider implementation
  // ---------------------------------------------------------------------------

  async collections(): Promise<string[]> {
    const { ListObjectsV2Command } = await import('@aws-sdk/client-s3');
    const client = await this.getClient();

    const listPrefix = `${this.prefix}/`;
    const response = await client.send(
      new ListObjectsV2Command({
        Bucket: this.bucket,
        Prefix: listPrefix,
        Delimiter: '/',
      })
    );

    const commonPrefixes = response.CommonPrefixes ?? [];
    return commonPrefixes
      .map((cp): string => cp.Prefix ?? '')
      .filter((p): p is string => Boolean(p))
      .map((p: string): string => {
        // e.g. "stackwright-content/collections/posts/" → "posts"
        const withoutBase = p.slice(listPrefix.length);
        return withoutBase.replace(/\/$/, '');
      })
      .filter((name): name is string => Boolean(name));
  }

  async list(collection: string, opts: CollectionListOptions = {}): Promise<CollectionListResult> {
    const indexKey = `${this.prefix}/${collection}/_index.json`;
    const raw = await this.fetchObject(indexKey);
    if (raw === null) return { entries: [], total: 0 };

    let entries: CollectionEntry[] = JSON.parse(raw) as CollectionEntry[];

    // Filter — exact match on specified fields
    if (opts.filter) {
      for (const [field, value] of Object.entries(opts.filter)) {
        entries = entries.filter((entry) => {
          const entryValue = entry[field];
          if (Array.isArray(entryValue)) return entryValue.includes(value);
          return entryValue === value;
        });
      }
    }

    // Sort — override manifest default sort if opts.sort is provided
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

    if (opts.offset && opts.offset > 0) {
      entries = entries.slice(opts.offset);
    }

    if (opts.limit && opts.limit > 0) {
      entries = entries.slice(0, opts.limit);
    }

    return { entries, total };
  }

  async get(collection: string, slug: string): Promise<CollectionEntry | null> {
    // Sanitize slug — allow only alphanumerics, hyphens, underscores
    const safeSlug = slug.replace(/[^a-zA-Z0-9_-]/g, '');
    if (!safeSlug) return null;

    const key = `${this.prefix}/${collection}/${safeSlug}.json`;
    const raw = await this.fetchObject(key);
    if (raw === null) return null;

    return JSON.parse(raw) as CollectionEntry;
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private async getClient(): Promise<S3Client> {
    if (this.clientOption) return this.clientOption;
    if (this.clientInstance) return this.clientInstance;

    const { S3Client } = await import('@aws-sdk/client-s3');
    this.clientInstance = new S3Client({});
    return this.clientInstance;
  }

  /** Fetch an S3 object and return its body as a UTF-8 string, or null if not found. */
  private async fetchObject(key: string): Promise<string | null> {
    const { GetObjectCommand } = await import('@aws-sdk/client-s3');
    const client = await this.getClient();

    let response: GetObjectCommandOutput;
    try {
      response = await client.send(new GetObjectCommand({ Bucket: this.bucket, Key: key }));
    } catch (err) {
      // S3 NoSuchKey / 404 → treat as not found
      if (isNotFoundError(err)) return null;
      throw err;
    }

    if (!response.Body) return null;
    return streamToString(response.Body);
  }
}

// ---------------------------------------------------------------------------
// Internal utilities
// ---------------------------------------------------------------------------

function isNotFoundError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false;
  const e = err as Record<string, unknown>;
  const code = e.Code ?? e.name;
  if (code === 'NoSuchKey' || code === 'NotFound') return true;
  const metadata = e.$metadata;
  if (metadata && typeof metadata === 'object') {
    return (metadata as Record<string, unknown>).httpStatusCode === 404;
  }
  return false;
}

async function streamToString(body: unknown): Promise<string> {
  // AWS SDK v3 SdkStreamMixin
  if (typeof (body as Record<string, unknown>).transformToString === 'function') {
    return (body as { transformToString(enc: string): Promise<string> }).transformToString('utf-8');
  }

  // Fallback: Node.js Readable stream
  return new Promise<string>((resolve, reject) => {
    const chunks: Buffer[] = [];
    const readable = body as NodeJS.ReadableStream;
    readable.on('data', (chunk: Buffer) =>
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
    );
    readable.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
    readable.on('error', reject);
  });
}
