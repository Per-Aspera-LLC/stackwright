import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// Mock @aws-sdk/client-s3 — pure vitest, zero real AWS calls.
// ---------------------------------------------------------------------------

const mockSend = vi.fn();

vi.mock('@aws-sdk/client-s3', () => {
  class S3Client {
    send = mockSend;
  }

  class GetObjectCommand {
    constructor(public input: Record<string, unknown>) {}
  }

  class ListObjectsV2Command {
    constructor(public input: Record<string, unknown>) {}
  }

  return { S3Client, GetObjectCommand, ListObjectsV2Command };
});

// Import after mocking so the module picks up our mock S3Client.
import { S3CollectionProvider } from '../src/s3-collection-provider';
import type { S3Client } from '@aws-sdk/client-s3';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const SAMPLE_ENTRIES = [
  { slug: 'alpha', title: 'Alpha', date: '2026-01-01' },
  { slug: 'beta', title: 'Beta', date: '2026-02-01' },
  { slug: 'gamma', title: 'Gamma', date: '2026-03-01' },
];

/** Create a fake response body with transformToString. */
function makeBody(data: unknown): Record<string, unknown> {
  return {
    transformToString: vi.fn().mockResolvedValue(JSON.stringify(data)),
  };
}

/** Make a client whose send() always resolves with a given body. */
function makeClientWith(body: unknown): S3Client {
  mockSend.mockResolvedValue({ Body: makeBody(body) });
  return { send: mockSend } as unknown as S3Client;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('S3CollectionProvider', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  // -- list() ----------------------------------------------------------------

  describe('list()', () => {
    it('fetches _index.json and returns all entries', async () => {
      const client = makeClientWith(SAMPLE_ENTRIES);
      const provider = new S3CollectionProvider({ bucket: 'my-bucket', client });

      const result = await provider.list('posts');

      expect(result.entries).toEqual(SAMPLE_ENTRIES);
      expect(result.total).toBe(3);
      expect(mockSend).toHaveBeenCalledOnce();
    });

    it('returns empty result when _index.json is not found (NoSuchKey)', async () => {
      const err = Object.assign(new Error('NoSuchKey'), { Code: 'NoSuchKey' });
      mockSend.mockRejectedValue(err);
      const provider = new S3CollectionProvider({
        bucket: 'my-bucket',
        client: { send: mockSend } as unknown as S3Client,
      });

      const result = await provider.list('nonexistent');

      expect(result.entries).toEqual([]);
      expect(result.total).toBe(0);
    });

    it('applies limit', async () => {
      const client = makeClientWith(SAMPLE_ENTRIES);
      const provider = new S3CollectionProvider({ bucket: 'my-bucket', client });

      const result = await provider.list('posts', { limit: 2 });

      expect(result.entries).toHaveLength(2);
      expect(result.total).toBe(3);
    });

    it('applies offset', async () => {
      const client = makeClientWith(SAMPLE_ENTRIES);
      const provider = new S3CollectionProvider({ bucket: 'my-bucket', client });

      const result = await provider.list('posts', { offset: 2 });

      expect(result.entries).toHaveLength(1);
      expect(result.entries[0].slug).toBe('gamma');
    });

    it('sorts ascending by field', async () => {
      const entries = [
        { slug: 'c', title: 'Charlie' },
        { slug: 'a', title: 'Alpha' },
        { slug: 'b', title: 'Beta' },
      ];
      makeClientWith(entries);
      const provider = new S3CollectionProvider({
        bucket: 'my-bucket',
        client: { send: mockSend } as unknown as S3Client,
      });

      const result = await provider.list('posts', { sort: 'title' });

      expect(result.entries.map((e) => e.slug)).toEqual(['a', 'b', 'c']);
    });

    it('sorts descending with - prefix', async () => {
      const client = makeClientWith(SAMPLE_ENTRIES);
      const provider = new S3CollectionProvider({ bucket: 'my-bucket', client });

      const result = await provider.list('posts', { sort: '-date' });

      expect(result.entries.map((e) => e.date)).toEqual(['2026-03-01', '2026-02-01', '2026-01-01']);
    });

    it('uses custom prefix in S3 key', async () => {
      const client = makeClientWith([]);
      const provider = new S3CollectionProvider({
        bucket: 'my-bucket',
        prefix: 'custom/prefix',
        client,
      });

      await provider.list('posts');

      const sentCommand = mockSend.mock.calls[0][0];
      expect(sentCommand.input.Key).toBe('custom/prefix/posts/_index.json');
    });
  });

  // -- get() -----------------------------------------------------------------

  describe('get()', () => {
    it('returns a single entry by slug', async () => {
      const entry = { slug: 'alpha', title: 'Alpha', body: 'Full content' };
      const client = makeClientWith(entry);
      const provider = new S3CollectionProvider({ bucket: 'my-bucket', client });

      const result = await provider.get('posts', 'alpha');

      expect(result).toEqual(entry);
      const sentCommand = mockSend.mock.calls[0][0];
      expect(sentCommand.input.Key).toBe('stackwright-content/collections/posts/alpha.json');
    });

    it('returns null when slug is not found (NoSuchKey)', async () => {
      const err = Object.assign(new Error('NoSuchKey'), { Code: 'NoSuchKey' });
      mockSend.mockRejectedValue(err);
      const provider = new S3CollectionProvider({
        bucket: 'my-bucket',
        client: { send: mockSend } as unknown as S3Client,
      });

      const result = await provider.get('posts', 'nonexistent');

      expect(result).toBeNull();
    });

    it('returns null without an S3 request when sanitized slug is empty', async () => {
      // '../' strips to '' (dots and slash are removed) → early null, no S3 call.
      // Note: '../../../etc/passwd' strips to 'etcpasswd' (letters survive), so that
      // path still makes a safe S3 request — but '..' alone strips completely.
      const provider = new S3CollectionProvider({
        bucket: 'my-bucket',
        client: { send: mockSend } as unknown as S3Client,
      });

      const result = await provider.get('posts', '../');

      expect(result).toBeNull();
      // No S3 request should have been made — we bailed out before fetchObject
      expect(mockSend).not.toHaveBeenCalled();
    });

    it('sanitizes slug — strips characters outside [a-zA-Z0-9_-]', async () => {
      const entry = { slug: 'my-post', title: 'My Post' };
      const client = makeClientWith(entry);
      const provider = new S3CollectionProvider({ bucket: 'my-bucket', client });

      await provider.get('posts', 'my-post!@#$');

      const sentCommand = mockSend.mock.calls[0][0];
      // Only alphanumerics + hyphens remain: "my-post"
      expect(sentCommand.input.Key).toBe('stackwright-content/collections/posts/my-post.json');
    });
  });

  // -- collections() ---------------------------------------------------------

  describe('collections()', () => {
    it('lists collection names from S3 CommonPrefixes', async () => {
      mockSend.mockResolvedValue({
        CommonPrefixes: [
          { Prefix: 'stackwright-content/collections/posts/' },
          { Prefix: 'stackwright-content/collections/docs/' },
        ],
      });
      const provider = new S3CollectionProvider({
        bucket: 'my-bucket',
        client: { send: mockSend } as unknown as S3Client,
      });

      const result = await provider.collections();

      expect(result.sort()).toEqual(['docs', 'posts']);
    });

    it('returns empty array when no CommonPrefixes', async () => {
      mockSend.mockResolvedValue({ CommonPrefixes: [] });
      const provider = new S3CollectionProvider({
        bucket: 'my-bucket',
        client: { send: mockSend } as unknown as S3Client,
      });

      const result = await provider.collections();

      expect(result).toEqual([]);
    });

    it('uses the correct prefix + delimiter in the ListObjectsV2 call', async () => {
      mockSend.mockResolvedValue({ CommonPrefixes: [] });
      const provider = new S3CollectionProvider({
        bucket: 'my-bucket',
        prefix: 'my/prefix',
        client: { send: mockSend } as unknown as S3Client,
      });

      await provider.collections();

      const sentCommand = mockSend.mock.calls[0][0];
      expect(sentCommand.input.Prefix).toBe('my/prefix/');
      expect(sentCommand.input.Delimiter).toBe('/');
    });
  });
});
