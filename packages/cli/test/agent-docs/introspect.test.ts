import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import {
  type AnySchema,
  type SchemaNameMap,
  resolveSchema,
  zodSchemaToTypeString,
  extractFields,
  literalTypeKey,
  getContentItemVariants,
  buildContentTypeModels,
  synthValue,
} from '../../src/agent-docs/introspect';
import { pageContentSchema } from '../../src/utils/schema-loader';
import { KNOWN_CONTENT_TYPE_KEYS, textBlockSchema } from '@stackwright/types';

const asAny = (s: unknown): AnySchema => s as AnySchema;
const noNames: SchemaNameMap = new Map();

describe('resolveSchema', () => {
  it('unwraps optional wrappers', () => {
    const inner = z.string();
    const resolved = resolveSchema(asAny(inner.optional()));
    expect(resolved.def.type).toBe('string');
  });

  it('unwraps nested optional(lazy(...)) wrappers', () => {
    const inner = z.object({ a: z.string() });
    const wrapped = z.lazy(() => inner).optional();
    const resolved = resolveSchema(asAny(wrapped));
    expect(resolved.def.type).toBe('object');
  });
});

describe('zodSchemaToTypeString', () => {
  it('renders primitives', () => {
    expect(zodSchemaToTypeString(asAny(z.string()), noNames)).toBe('string');
    expect(zodSchemaToTypeString(asAny(z.number()), noNames)).toBe('number');
    expect(zodSchemaToTypeString(asAny(z.boolean()), noNames)).toBe('boolean');
  });

  it('renders enums as backticked unions', () => {
    expect(zodSchemaToTypeString(asAny(z.enum(['a', 'b'])), noNames)).toBe('`a` | `b`');
  });

  it('renders literals quoted', () => {
    expect(zodSchemaToTypeString(asAny(z.literal('main')), noNames)).toBe('"main"');
  });

  it('renders arrays with element type', () => {
    expect(zodSchemaToTypeString(asAny(z.array(z.number())), noNames)).toBe('number[]');
  });

  it('prefers display names from the name map', () => {
    const names: SchemaNameMap = new Map([[textBlockSchema as object, 'TextBlock']]);
    expect(zodSchemaToTypeString(asAny(textBlockSchema), names)).toBe('TextBlock');
    expect(zodSchemaToTypeString(asAny(z.array(textBlockSchema)), names)).toBe('TextBlock[]');
  });

  it('renders unions member-by-member', () => {
    expect(zodSchemaToTypeString(asAny(z.union([z.string(), z.number()])), noNames)).toBe(
      'string | number'
    );
  });
});

describe('extractFields', () => {
  const schema = z.object({
    name: z.string(),
    count: z.number().optional(),
    mode: z.enum(['on', 'off']),
  });

  it('captures name, type, and requiredness', () => {
    const fields = extractFields(asAny(schema), noNames);
    expect(fields).toEqual([
      { name: 'name', type: 'string', required: true },
      { name: 'count', type: 'number', required: false },
      { name: 'mode', type: '`on` | `off`', required: true, enumValues: ['on', 'off'] },
    ]);
  });

  it('returns [] for non-object schemas', () => {
    expect(extractFields(asAny(z.string()), noNames)).toEqual([]);
  });
});

describe('literalTypeKey', () => {
  it('extracts the type discriminator literal', () => {
    const schema = z.object({ type: z.literal('alert'), body: z.string() });
    expect(literalTypeKey(asAny(schema))).toBe('alert');
  });

  it('returns null when no literal type field exists', () => {
    expect(literalTypeKey(asAny(z.object({ a: z.string() })))).toBeNull();
  });
});

describe('content-type model building (live schemas)', () => {
  it('finds every known content type key, in schema declaration order', () => {
    const models = buildContentTypeModels(asAny(pageContentSchema), noNames);
    expect(models.map((m) => m.key)).toEqual([
      'carousel',
      'main',
      'tabbed_content',
      'media',
      'timeline',
      'icon_grid',
      'code_block',
      'feature_list',
      'testimonial_grid',
      'faq',
      'pricing_table',
      'alert',
      'contact_form_stub',
      'form',
      'text_block',
      'grid',
      'collection_list',
      'video',
      'map',
    ]);
    // Guard: the model must cover the full published key list (order aside)
    expect(new Set(models.map((m) => m.key))).toEqual(new Set(KNOWN_CONTENT_TYPE_KEYS));
  });

  it('every model inherits the BaseContent label field as required', () => {
    const models = buildContentTypeModels(asAny(pageContentSchema), noNames);
    for (const model of models) {
      const label = model.fields.find((f) => f.name === 'label');
      expect(label, `label missing on ${model.key}`).toBeDefined();
      expect(label!.required).toBe(true);
    }
  });

  it('getContentItemVariants returns one variant per model', () => {
    const variants = getContentItemVariants(asAny(pageContentSchema));
    const models = buildContentTypeModels(asAny(pageContentSchema), noNames);
    expect(variants.length).toBe(models.length);
  });
});

describe('synthValue', () => {
  it('synthesizes deterministic minimal values (required fields only)', () => {
    const schema = z.object({
      type: z.literal('alert'),
      variant: z.enum(['info', 'warning']),
      body: z.string(),
      title: z.string().optional(),
      tags: z.array(z.string()),
    });
    expect(synthValue(asAny(schema))).toEqual({
      type: 'alert',
      variant: 'info',
      body: 'example',
      tags: ['example'],
    });
  });

  it('terminates on recursive schemas (depth cap)', () => {
    const variants = getContentItemVariants(asAny(pageContentSchema));
    // grid and tabbed_content recurse into the ContentItem union
    for (const variant of variants) {
      expect(() => synthValue(variant)).not.toThrow();
    }
  });

  it('is deterministic across calls', () => {
    const variants = getContentItemVariants(asAny(pageContentSchema));
    for (const variant of variants) {
      expect(synthValue(variant)).toEqual(synthValue(variant));
    }
  });
});
