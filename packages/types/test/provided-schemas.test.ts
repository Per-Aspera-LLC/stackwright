/**
 * Provided-schema declaration contract tests.
 *
 * Mirrors the generic parts of the Pro schema-registry test suite (the
 * mechanism was upstreamed from there). Covers:
 *  - toPrebuildPluginFields: props-only wrapping, existing-discriminant
 *    passthrough, non-object fallback, factory-only skipping
 *  - assertHasSchema: the exactly-one schema/schemaFactory invariant
 */
import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import type { ProvidedSchemas, PrebuildPluginWithSchemas } from '../src/types/plugin';
import { assertHasSchema } from '../src/types/plugin';
import { toPrebuildPluginFields } from '../src/types/validation';

// ---------------------------------------------------------------------------
// Fixtures — generic, no Pro-specific schemas
// ---------------------------------------------------------------------------

const propsOnlySchemas: ProvidedSchemas = {
  metric_card: {
    schema: z.object({ collection: z.string(), field: z.string() }),
    synonyms: { field: ['valueField', 'dataField'] },
    phaseAffinity: ['dashboard'],
  },
  data_table: {
    schema: z.object({
      collection: z.string(),
      columns: z.array(z.object({ field: z.string(), header: z.string() })),
    }),
  },
};

const discriminantSchemas: ProvidedSchemas = {
  wizard: {
    schema: z.object({
      type: z.literal('wizard'),
      label: z.string(),
    }),
  },
};

// ---------------------------------------------------------------------------
// toPrebuildPluginFields — props-only schemas get a type discriminant
// ---------------------------------------------------------------------------

describe('toPrebuildPluginFields — props-only schemas', () => {
  const { contentItemSchemas, knownContentTypeKeys } = toPrebuildPluginFields(propsOnlySchemas);

  it('produces one content-item schema per entry', () => {
    expect(contentItemSchemas).toHaveLength(2);
    expect(knownContentTypeKeys).toEqual(['metric_card', 'data_table']);
  });

  it('injected type discriminant accepts the matching key', () => {
    const schema = (contentItemSchemas as z.ZodTypeAny[])[0];
    const result = schema.safeParse({ type: 'metric_card', collection: 'metrics', field: 'v' });
    expect(result.success).toBe(true);
  });

  it('injected type discriminant rejects a wrong key', () => {
    const schema = (contentItemSchemas as z.ZodTypeAny[])[0];
    const result = schema.safeParse({ type: 'wrong_type', collection: 'metrics', field: 'v' });
    expect(result.success).toBe(false);
  });

  it('still enforces the underlying props schema', () => {
    const schema = (contentItemSchemas as z.ZodTypeAny[])[1];
    const result = schema.safeParse({ type: 'data_table', collection: 'alerts' });
    expect(result.success).toBe(false); // missing required columns
  });
});

// ---------------------------------------------------------------------------
// toPrebuildPluginFields — schemas with existing discriminants pass through
// ---------------------------------------------------------------------------

describe('toPrebuildPluginFields — existing discriminant', () => {
  const { contentItemSchemas, knownContentTypeKeys } = toPrebuildPluginFields(discriminantSchemas);

  it('uses the schema as-is (no double wrapping)', () => {
    const schema = (contentItemSchemas as z.ZodTypeAny[])[0];
    expect(schema.safeParse({ type: 'wizard', label: 'Intake' }).success).toBe(true);
    expect(schema.safeParse({ type: 'not_wizard', label: 'Intake' }).success).toBe(false);
    expect(knownContentTypeKeys).toEqual(['wizard']);
  });
});

// ---------------------------------------------------------------------------
// toPrebuildPluginFields — non-ZodObject fallback
// ---------------------------------------------------------------------------

describe('toPrebuildPluginFields — non-object schema fallback', () => {
  it('intersects a non-object schema with a type-literal object', () => {
    const weird: ProvidedSchemas = {
      record_thing: { schema: z.record(z.string(), z.unknown()) },
    };
    const { contentItemSchemas, knownContentTypeKeys } = toPrebuildPluginFields(weird);
    expect(knownContentTypeKeys).toEqual(['record_thing']);
    const schema = (contentItemSchemas as z.ZodTypeAny[])[0];
    expect(schema.safeParse({ type: 'record_thing', anything: 'goes' }).success).toBe(true);
    expect(schema.safeParse({ type: 'other_thing' }).success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// toPrebuildPluginFields — factory-only entries are skipped
// ---------------------------------------------------------------------------

describe('toPrebuildPluginFields — factory-only entries are skipped', () => {
  const factoryOnlyMap: ProvidedSchemas = {
    some_key: { schemaFactory: () => z.string() },
  };

  const { contentItemSchemas, knownContentTypeKeys } = toPrebuildPluginFields(factoryOnlyMap);

  it('contentItemSchemas is empty for a factory-only map', () => {
    expect(contentItemSchemas).toHaveLength(0);
  });

  it('knownContentTypeKeys is empty for a factory-only map (no build-time key)', () => {
    // Factory-only entries need runtime context — they are NOT valid at build
    // time. Including them in knownContentTypeKeys would mislead the validator.
    expect(knownContentTypeKeys).toHaveLength(0);
  });

  it('mixed map: only static entries contribute to the output', () => {
    const mixedMap: ProvidedSchemas = {
      static_thing: { schema: z.object({ id: z.string() }) },
      factory_thing: { schemaFactory: () => z.string() },
    };
    const result = toPrebuildPluginFields(mixedMap);
    expect(result.knownContentTypeKeys).toEqual(['static_thing']);
    expect(result.contentItemSchemas).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// assertHasSchema guard
// ---------------------------------------------------------------------------

describe('assertHasSchema', () => {
  it('does not throw for an entry with a static schema', () => {
    const entry = { schema: z.string() };
    expect(() => assertHasSchema(entry, 'my_key')).not.toThrow();
  });

  it('throws for a factory-only entry with no schema', () => {
    const entry = { schemaFactory: () => z.string() };
    expect(() => assertHasSchema(entry, 'factory_key')).toThrow(
      'Registry entry "factory_key" has no static schema'
    );
  });

  it('throws for an empty entry', () => {
    const entry = {};
    expect(() => assertHasSchema(entry, 'empty_key')).toThrow(
      'Registry entry "empty_key" has no static schema'
    );
  });
});

// ---------------------------------------------------------------------------
// PrebuildPluginWithSchemas — type-level smoke test
// ---------------------------------------------------------------------------

describe('PrebuildPluginWithSchemas', () => {
  it('accepts a plugin declaring providedSchemas and projects onto flat fields', () => {
    const plugin: PrebuildPluginWithSchemas = {
      name: 'test-plugin',
      providedSchemas: propsOnlySchemas,
    };
    const fields = toPrebuildPluginFields(plugin.providedSchemas ?? {});
    expect(fields.knownContentTypeKeys).toEqual(['metric_card', 'data_table']);
  });
});
