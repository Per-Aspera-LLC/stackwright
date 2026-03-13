import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import yaml from 'js-yaml';
import { generateDefaults } from '../../src/utils/schema-defaults';
import type { HintMap } from '../../src/utils/schema-defaults';
import { siteConfigSchema, pageContentSchema } from '../../src/utils/schema-loader';
import {
  getSiteConfigHints,
  getRootPageHints,
  getGettingStartedHints,
} from '../../src/utils/scaffold-hints';

// ---------------------------------------------------------------------------
// Unit tests: primitive handling
// ---------------------------------------------------------------------------

describe('generateDefaults — primitives', () => {
  it('generates string default', () => {
    expect(generateDefaults(z.string() as any)).toBe('example');
  });

  it('generates number default', () => {
    expect(generateDefaults(z.number() as any)).toBe(0);
  });

  it('generates boolean default', () => {
    expect(generateDefaults(z.boolean() as any)).toBe(false);
  });

  it('uses hint value over default', () => {
    const hints: HintMap = { '': { value: 'custom' } };
    expect(generateDefaults(z.string() as any, hints, '')).toBe('custom');
  });

  it('picks first enum entry', () => {
    const schema = z.enum(['alpha', 'beta', 'gamma']);
    expect(generateDefaults(schema as any)).toBe('alpha');
  });

  it('uses hint value for enum', () => {
    const schema = z.enum(['alpha', 'beta', 'gamma']);
    const hints: HintMap = { '': { value: 'gamma' } };
    expect(generateDefaults(schema as any, hints, '')).toBe('gamma');
  });
});

// ---------------------------------------------------------------------------
// Unit tests: objects
// ---------------------------------------------------------------------------

describe('generateDefaults — objects', () => {
  it('generates required fields only by default', () => {
    const schema = z.object({
      name: z.string(),
      age: z.number(),
      bio: z.string().optional(),
    });
    const result = generateDefaults(schema as any) as Record<string, unknown>;
    expect(result).toHaveProperty('name');
    expect(result).toHaveProperty('age');
    expect(result).not.toHaveProperty('bio');
  });

  it('includes optional fields when hinted', () => {
    const schema = z.object({
      name: z.string(),
      bio: z.string().optional(),
    });
    const hints: HintMap = { bio: { value: 'hello', include: true } };
    const result = generateDefaults(schema as any, hints) as Record<string, unknown>;
    expect(result.bio).toBe('hello');
  });

  it('handles nested objects', () => {
    const schema = z.object({
      outer: z.object({
        inner: z.string(),
      }),
    });
    const hints: HintMap = { 'outer.inner': { value: 'nested' } };
    const result = generateDefaults(schema as any, hints) as any;
    expect(result.outer.inner).toBe('nested');
  });
});

// ---------------------------------------------------------------------------
// Unit tests: arrays
// ---------------------------------------------------------------------------

describe('generateDefaults — arrays', () => {
  it('generates empty array by default', () => {
    const schema = z.object({
      items: z.array(z.string()),
    });
    const result = generateDefaults(schema as any) as any;
    expect(result.items).toEqual([]);
  });

  it('generates N items when hinted', () => {
    const schema = z.object({
      items: z.array(z.string()),
    });
    const hints: HintMap = {
      items: { arrayLength: 3 },
      'items.0': { value: 'a' },
      'items.1': { value: 'b' },
      'items.2': { value: 'c' },
    };
    const result = generateDefaults(schema as any, hints) as any;
    expect(result.items).toEqual(['a', 'b', 'c']);
  });
});

// ---------------------------------------------------------------------------
// Unit tests: pick-one (ContentItem-style)
// ---------------------------------------------------------------------------

describe('generateDefaults — pick-one objects', () => {
  it('generates all-optional object as empty when no hints', () => {
    const schema = z.object({
      alpha: z.string().optional(),
      beta: z.number().optional(),
    });
    // Without a pick hint, all-optional objects generate as empty (no required fields)
    const result = generateDefaults(schema as any);
    expect(result).toEqual({});
  });

  it('populates only the picked key', () => {
    const innerA = z.object({ name: z.string() });
    const innerB = z.object({ count: z.number() });
    const schema = z.object({
      alpha: innerA.optional(),
      beta: innerB.optional(),
    });
    const hints: HintMap = {
      '': { pick: 'alpha' },
      'alpha.name': { value: 'picked' },
    };
    const result = generateDefaults(schema as any, hints, '') as any;
    expect(result).toHaveProperty('alpha');
    expect(result).not.toHaveProperty('beta');
    expect(result.alpha.name).toBe('picked');
  });
});

// ---------------------------------------------------------------------------
// Unit tests: lazy + cycle detection
// ---------------------------------------------------------------------------

describe('generateDefaults — lazy and cycles', () => {
  it('resolves lazy schemas', () => {
    const schema = z.lazy(() => z.string());
    expect(generateDefaults(schema as any)).toBe('example');
  });

  it('handles optional(lazy(...)) wrapping', () => {
    const schema = z.object({
      field: z.lazy(() => z.string()).optional(),
    });
    const hints: HintMap = { field: { value: 'resolved', include: true } };
    const result = generateDefaults(schema as any, hints) as any;
    expect(result.field).toBe('resolved');
  });
});

// ---------------------------------------------------------------------------
// Integration: SiteConfig schema
// ---------------------------------------------------------------------------

describe('generateDefaults — SiteConfig integration', () => {
  it('generates valid SiteConfig that passes schema.parse()', () => {
    const hints = getSiteConfigHints('Test Site', 'corporate', 2025);
    const result = generateDefaults(siteConfigSchema as any, hints);

    // Should not throw
    const parsed = siteConfigSchema.parse(result);
    expect(parsed.title).toBe('Test Site');
    expect(parsed.appBar.titleText).toBe('Test Site');
    expect(parsed.navigation).toHaveLength(2);
    expect(parsed.navigation[0].label).toBe('Home');
    expect(parsed.navigation[1].label).toBe('Getting Started');
  });

  it('produces YAML that round-trips through parse', () => {
    const hints = getSiteConfigHints('Round Trip', 'soft', 2025);
    const result = generateDefaults(siteConfigSchema as any, hints);
    const yamlStr = yaml.dump(result, { lineWidth: 120 });
    const reparsed = yaml.load(yamlStr);
    const validated = siteConfigSchema.parse(reparsed);
    expect(validated.title).toBe('Round Trip');
  });

  it('includes customTheme with correct colors', () => {
    const hints = getSiteConfigHints('Themed', 'corporate', 2025);
    const result = generateDefaults(siteConfigSchema as any, hints) as any;
    expect(result.customTheme).toBeDefined();
    expect(result.customTheme.colors.primary).toBe('#1976d2');
    expect(result.customTheme.typography.fontFamily.primary).toBe('Inter');
    expect(result.customTheme.spacing.md).toBe('1rem');
  });
});

// ---------------------------------------------------------------------------
// Integration: PageContent schema
// ---------------------------------------------------------------------------

describe('generateDefaults — PageContent integration', () => {
  it('generates valid root page content that passes schema.parse()', () => {
    const hints = getRootPageHints('My Site');
    const result = generateDefaults(pageContentSchema as any, hints);

    // Should not throw
    const parsed = pageContentSchema.parse(result);
    expect(parsed.content.content_items).toHaveLength(1);
  });

  it('generates valid getting-started page that passes schema.parse()', () => {
    const hints = getGettingStartedHints();
    const result = generateDefaults(pageContentSchema as any, hints);

    const parsed = pageContentSchema.parse(result);
    expect(parsed.content.content_items).toHaveLength(5);
  });

  it('root page YAML round-trips', () => {
    const hints = getRootPageHints('YAML Test');
    const result = generateDefaults(pageContentSchema as any, hints);
    const yamlStr = yaml.dump(result, { lineWidth: 120 });
    const reparsed = yaml.load(yamlStr);
    const validated = pageContentSchema.parse(reparsed);
    expect(validated.content.content_items.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// Comparison: generated output vs old builder functions
// ---------------------------------------------------------------------------

describe('generateDefaults — equivalence to old builders', () => {
  it('site config has same structure as old buildSiteConfig', () => {
    const hints = getSiteConfigHints('Test', 'corporate', 2025);
    const result = generateDefaults(siteConfigSchema as any, hints) as any;

    // Structural checks matching the old builder
    expect(result.title).toBe('Test');
    expect(result.themeName).toBe('corporate');
    expect(result.appBar.titleText).toBe('Test');
    expect(result.appBar.backgroundColor).toBe('primary');
    expect(result.appBar.textColor).toBe('secondary');
    expect(result.navigation).toHaveLength(2);
    expect(result.footer.copyright).toContain('2025');
    expect(result.footer.links).toEqual([]);
    expect(result.customTheme.id).toBe('custom');
  });

  it('root page has hero section with main content type', () => {
    const hints = getRootPageHints('Hello');
    const result = generateDefaults(pageContentSchema as any, hints) as any;

    const item = result.content.content_items[0];
    expect(item.type).toBe('main');
    expect(item.label).toBe('hero-section');
    expect(item.heading.text).toBe('Welcome to Hello');
    expect(item.heading.textSize).toBe('h1');
    expect(item.textBlocks).toHaveLength(2);
  });

  it('getting-started page has 5 content items', () => {
    const hints = getGettingStartedHints();
    const result = generateDefaults(pageContentSchema as any, hints) as any;

    expect(result.content.content_items).toHaveLength(5);
    // Check code_block item
    const codeItem = result.content.content_items[2];
    expect(codeItem.type).toBe('code_block');
    expect(codeItem.language).toBe('bash');
  });
});
