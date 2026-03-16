import { z } from 'zod';
import { textBlockSchema } from './base';

// ---------------------------------------------------------------------------
// Collection config — lives in _collection.yaml
// ---------------------------------------------------------------------------

/** Maps collection entry fields to named display slots in an entry page. */
export const entryPageConfigSchema = z.object({
  /** URL path prefix. Each entry generates a page at `<basePath><slug>`. */
  basePath: z.string(),
  /** Field name whose value is rendered as the main content body. Used by the default template. */
  body: z.string().optional(),
  /** Field names shown as metadata (date, author, etc.). Used by the default template. */
  meta: z.array(z.string()).optional(),
  /** Field name containing tags / categories. Used by the default template. */
  tags: z.string().optional(),
  /**
   * Custom layout template using Stackwright content types with `{{fieldName}}` placeholders.
   * When present, `body`, `meta`, and `tags` are ignored — the template has full control.
   * The shape mirrors a page's `content` block: `{ content_items: [...] }`.
   */
  template: z
    .object({
      content_items: z.array(z.record(z.string(), z.unknown())),
    })
    .optional(),
});

/**
 * Schema for optional `_collection.yaml` config files.
 *
 * Each collection directory may contain a `_collection.yaml` that controls
 * how the prebuild pipeline compiles entries into the manifest (`_index.json`)
 * and optionally generates individual entry pages.
 */
export const collectionConfigSchema = z.object({
  /** Default sort field. Prefix with `-` for descending (e.g. `-date`). */
  sort: z.string().optional(),
  /** Fields to include in `_index.json` manifest. If omitted, all top-level scalar fields are included. */
  indexFields: z.array(z.string()).optional(),
  /** Generate individual pages for each entry. */
  entryPage: entryPageConfigSchema.optional(),
});

export type EntryPageConfig = z.infer<typeof entryPageConfigSchema>;
export type CollectionConfig = z.infer<typeof collectionConfigSchema>;

// ---------------------------------------------------------------------------
// collection_list content type — used in page YAML
// ---------------------------------------------------------------------------

/** Maps collection entry fields to card display slots. */
export const collectionCardMappingSchema = z.object({
  /** Field name to use as card title. */
  title: z.string(),
  /** Field name to use as card subtitle / excerpt. */
  subtitle: z.string().optional(),
  /** Field name to use as metadata line (e.g. date). */
  meta: z.string().optional(),
  /** Field name containing tags array. */
  tags: z.string().optional(),
});

export const collectionListContentSchema = z.object({
  /** Content item type discriminator. */
  type: z.literal('collection_list'),
  /** Content type label (required by all content types). */
  label: z.string(),
  /** Name of the collection to pull entries from. */
  source: z.string(),
  /** Display layout. */
  layout: z.enum(['cards', 'compact', 'list']).optional().default('cards'),
  /** Number of grid columns (for cards layout). */
  columns: z.number().optional(),
  /** Maximum entries to display. */
  limit: z.number().optional(),
  /** URL prefix for entry links. Slug is appended automatically. */
  hrefPrefix: z.string().optional(),
  /** Map collection fields to card display slots. */
  card: collectionCardMappingSchema,
  /** Optional heading above the listing. */
  heading: textBlockSchema.optional(),
  /** Background color or theme token. */
  background: z.string().optional(),
  /** Text color or theme token. */
  color: z.string().optional(),
});

export type CollectionCardMapping = z.infer<typeof collectionCardMappingSchema>;
export type CollectionListContent = z.infer<typeof collectionListContentSchema>;
