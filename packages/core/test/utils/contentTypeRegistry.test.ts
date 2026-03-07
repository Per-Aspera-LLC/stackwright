import { describe, it, expect, beforeEach } from 'vitest';
import { ComponentType } from 'react';
import { z } from 'zod';
import {
  registerContentType,
  getRegisteredContentTypes,
  getContentTypeSchema,
  clearContentTypeRegistry,
} from '../../src/utils/contentTypeRegistry';
import { getComponentByType } from '../../src/utils/componentRegistry';

const StubComponent = (() => null) as unknown as ComponentType<any>;
const testSchema = z.object({ label: z.string(), text: z.string() });

beforeEach(() => {
  clearContentTypeRegistry();
});

describe('registerContentType', () => {
  it('makes the component findable via getComponentByType', () => {
    registerContentType('test_widget', testSchema, StubComponent);
    expect(getComponentByType('test_widget')).toBe(StubComponent);
  });

  it('stores the schema retrievable via getContentTypeSchema', () => {
    registerContentType('test_widget', testSchema, StubComponent);
    expect(getContentTypeSchema('test_widget')).toBe(testSchema);
  });

  it('returns undefined for an unregistered key', () => {
    expect(getContentTypeSchema('nonexistent')).toBeUndefined();
  });

  it('overwrites an existing registration (last write wins)', () => {
    const SchemaA = z.object({ a: z.string() });
    const SchemaB = z.object({ b: z.string() });
    const CompA = (() => null) as unknown as ComponentType<any>;
    const CompB = (() => null) as unknown as ComponentType<any>;

    registerContentType('test_widget', SchemaA, CompA);
    registerContentType('test_widget', SchemaB, CompB);

    expect(getContentTypeSchema('test_widget')).toBe(SchemaB);
    expect(getComponentByType('test_widget')).toBe(CompB);
  });
});

describe('getRegisteredContentTypes', () => {
  it('returns an empty array when nothing is registered', () => {
    expect(getRegisteredContentTypes()).toEqual([]);
  });

  it('returns all registered entries', () => {
    const schemaB = z.object({ value: z.number() });
    const CompB = (() => null) as unknown as ComponentType<any>;

    registerContentType('test_widget', testSchema, StubComponent);
    registerContentType('another_widget', schemaB, CompB);

    const entries = getRegisteredContentTypes();
    expect(entries).toHaveLength(2);
    expect(entries.map((e) => e.key)).toContain('test_widget');
    expect(entries.map((e) => e.key)).toContain('another_widget');
  });

  it('each entry has key, schema, and component', () => {
    registerContentType('test_widget', testSchema, StubComponent);
    const [entry] = getRegisteredContentTypes();
    expect(entry.key).toBe('test_widget');
    expect(entry.schema).toBe(testSchema);
    expect(entry.component).toBe(StubComponent);
  });
});

describe('clearContentTypeRegistry', () => {
  it('removes all registered types', () => {
    registerContentType('test_widget', testSchema, StubComponent);
    clearContentTypeRegistry();
    expect(getRegisteredContentTypes()).toEqual([]);
    expect(getContentTypeSchema('test_widget')).toBeUndefined();
  });

  it('also deregisters components from componentRegistry', () => {
    registerContentType('test_widget', testSchema, StubComponent);
    expect(getComponentByType('test_widget')).toBe(StubComponent);
    clearContentTypeRegistry();
    expect(getComponentByType('test_widget')).toBeNull();
  });
});
