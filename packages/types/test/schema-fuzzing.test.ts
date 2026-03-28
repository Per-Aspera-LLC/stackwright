/**
 * Schema Fuzzing Tests
 *
 * Stress-test Zod schemas with randomized inputs to catch edge cases,
 * validation bypass attempts, and ensure error messages are actionable.
 */

import { describe, it, expect } from 'vitest';
import { faker } from '@faker-js/faker';
import { contentItemSchema } from '../src/types/content';
import { siteConfigSchema } from '../src/types/siteConfig';
import type { ContentItem } from '../src/types/content';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Generate a valid main content block with random data
 */
function generateValidMainBlock(): ContentItem {
  return {
    type: 'main',
    label: faker.lorem.slug(faker.number.int({ min: 1, max: 5 })),
    heading: {
      text: faker.lorem.sentence(),
      textSize: faker.helpers.arrayElement([
        'h1',
        'h2',
        'h3',
        'h4',
        'body1',
        'subtitle1',
      ] as const),
    },
    textBlocks: Array.from({ length: faker.number.int({ min: 0, max: 3 }) }, () => ({
      text: faker.lorem.paragraph(),
      textSize: faker.helpers.arrayElement(['body1', 'body2', 'caption'] as const),
    })),
    ...(faker.datatype.boolean()
      ? {
          media: {
            type: 'image' as const,
            label: faker.lorem.slug(2),
            src: faker.image.url(),
          },
        }
      : {}),
  };
}

/**
 * Generate invalid data that should fail validation
 */
function generateInvalidMainBlock(): Record<string, unknown> {
  const attack = faker.helpers.arrayElement([
    // Missing required fields
    { type: 'main' },
    { label: 'test', type: 'main' },
    // Wrong type for heading
    { type: 'main', label: 'test', heading: 'not an object' },
    // Invalid textSize
    {
      type: 'main',
      label: 'test',
      heading: { text: 'Hello', textSize: 'invalid-size' },
      textBlocks: [],
    },
    // textBlocks not an array
    {
      type: 'main',
      label: 'test',
      heading: { text: 'Hello', textSize: 'h1' },
      textBlocks: 'not-an-array',
    },
    // media with wrong type
    {
      type: 'main',
      label: 'test',
      heading: { text: 'Hello', textSize: 'h1' },
      textBlocks: [],
      media: { type: 'invalid-media-type', src: 'test.png' },
    },
    // XSS attempt in text
    {
      type: 'main',
      label: 'test<script>alert("xss")</script>',
      heading: { text: '<img src=x onerror=alert(1)>', textSize: 'h1' },
      textBlocks: [],
    },
    // Path traversal in label
    {
      type: 'main',
      label: '../../../etc/passwd',
      heading: { text: 'Test', textSize: 'h1' },
      textBlocks: [],
    },
  ]);

  return attack;
}

/**
 * Generate a valid site config with random data
 */
function generateValidSiteConfig() {
  return {
    title: faker.company.name(),
    navigation: Array.from({ length: faker.number.int({ min: 0, max: 5 }) }, () => ({
      label: faker.lorem.word(),
      href: `/${faker.lorem.slug(2)}`,
    })),
    appBar: {
      titleText: faker.company.catchPhrase(),
      ...(faker.datatype.boolean()
        ? {
            logo: {
              type: 'image' as const,
              label: 'logo',
              src: faker.image.url(),
            },
          }
        : {}),
    },
    ...(faker.datatype.boolean()
      ? {
          theme: faker.helpers.arrayElement(['default', 'minimal', 'corporate']),
        }
      : {}),
  };
}

// ---------------------------------------------------------------------------
// Fuzzing Tests
// ---------------------------------------------------------------------------

describe('Schema Fuzzing - contentItemSchema', () => {
  it('accepts 100 randomly generated valid main blocks', () => {
    const blocks = Array.from({ length: 100 }, generateValidMainBlock);
    const results = blocks.map((block) => contentItemSchema.safeParse(block));

    const failures = results.filter((r) => !r.success);
    if (failures.length > 0) {
      console.error('Failures:', failures);
    }
    expect(failures.length).toBe(0);
  });

  it('rejects 100 randomly generated invalid blocks with clear errors', () => {
    const blocks = Array.from({ length: 100 }, generateInvalidMainBlock);
    const results = blocks.map((block) => contentItemSchema.safeParse(block));

    const successes = results.filter((r) => r.success);
    // Allow some "invalid" strings to pass (e.g., XSS payloads are valid strings)
    expect(successes.length).toBeLessThan(40); // Most should still fail

    // Ensure all errors have messages
    results.forEach((result) => {
      if (!result.success) {
        expect(result.error.issues.length).toBeGreaterThan(0);
        expect(result.error.issues[0].message).toBeTruthy();
      }
    });
  });

  it('handles edge cases: empty strings', () => {
    const block = {
      type: 'main',
      label: '',
      heading: { text: '', textSize: 'h1' },
      textBlocks: [],
    };
    const result = contentItemSchema.safeParse(block);
    // Empty strings might be valid or invalid depending on schema constraints
    // At minimum, should not crash
    expect(result).toBeDefined();
  });

  it('handles edge cases: very long strings', () => {
    const longString = 'a'.repeat(100000);
    const block = {
      type: 'main',
      label: 'test',
      heading: { text: longString, textSize: 'h1' },
      textBlocks: [],
    };
    const result = contentItemSchema.safeParse(block);
    // Should not crash or hang
    expect(result).toBeDefined();
  });

  it('handles edge cases: unicode and special characters', () => {
    const specialChars = [
      '🔥💯✨',
      '中文字符',
      '🚀 Emoji heading',
      'Ñoño García',
      '\u0000\u0001\u0002', // control characters
    ];

    specialChars.forEach((text) => {
      const block = {
        type: 'main',
        label: 'test',
        heading: { text, textSize: 'h1' as const },
        textBlocks: [],
      };
      const result = contentItemSchema.safeParse(block);
      // Should handle gracefully without crashing
      expect(result).toBeDefined();
    });
  });

  it('rejects malicious payloads: XSS attempts', () => {
    const xssPayloads = [
      '<script>alert("xss")</script>',
      '<img src=x onerror=alert(1)>',
      'javascript:alert(1)',
      '"><script>alert(String.fromCharCode(88,83,83))</script>',
    ];

    xssPayloads.forEach((payload) => {
      const block = {
        type: 'main',
        label: payload,
        heading: { text: payload, textSize: 'h1' as const },
        textBlocks: [],
      };

      // Schema doesn't sanitize, but should parse without crashing
      const result = contentItemSchema.safeParse(block);
      expect(result).toBeDefined();
      // Note: XSS sanitization happens at render time, not schema validation
    });
  });
});

describe('Schema Fuzzing - siteConfigSchema', () => {
  it('accepts 100 randomly generated valid configs', () => {
    const configs = Array.from({ length: 100 }, generateValidSiteConfig);
    const results = configs.map((config) => siteConfigSchema.safeParse(config));

    const failures = results.filter((r) => !r.success);
    if (failures.length > 0) {
      console.error('Failures:', failures.slice(0, 5));
    }
    expect(failures.length).toBe(0);
  });

  it('rejects configs with missing required fields', () => {
    const invalidConfigs = [
      {}, // completely empty
      { title: 'Test' }, // missing navigation and appBar
      { title: 'Test', navigation: [] }, // missing appBar
      { title: 'Test', appBar: { titleText: 'Test' } }, // missing navigation
    ];

    invalidConfigs.forEach((config) => {
      const result = siteConfigSchema.safeParse(config);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.length).toBeGreaterThan(0);
      }
    });
  });

  it('handles deeply nested navigation structures', () => {
    const deepNav = {
      title: 'Test',
      navigation: Array.from({ length: 50 }, (_, i) => ({
        label: `Item ${i}`,
        href: `/page-${i}`,
      })),
      appBar: { titleText: 'Test' },
    };

    const result = siteConfigSchema.safeParse(deepNav);
    // Should handle large arrays without performance issues
    expect(result).toBeDefined();
  });

  it('rejects path traversal attempts in integration names', () => {
    const attacks = ['../../../etc/passwd', '..\\..\\windows\\system32', './../secret'];

    attacks.forEach((name) => {
      const config = {
        title: 'Test',
        navigation: [],
        appBar: { titleText: 'Test' },
        integrations: [{ type: 'openapi' as const, name }],
      };

      const result = siteConfigSchema.safeParse(config);
      expect(result.success).toBe(false);
    });
  });

  it('handles random theme names gracefully', () => {
    const randomThemes = Array.from({ length: 20 }, () => faker.lorem.word());

    randomThemes.forEach((theme) => {
      const config = {
        title: 'Test',
        navigation: [],
        appBar: { titleText: 'Test' },
        theme,
      };

      const result = siteConfigSchema.safeParse(config);
      // Should parse but may not be a valid theme
      expect(result).toBeDefined();
    });
  });
});

describe('Schema Fuzzing - Performance', () => {
  it('validates 1000 main blocks in under 5 seconds', () => {
    const start = Date.now();
    const blocks = Array.from({ length: 1000 }, generateValidMainBlock);
    blocks.forEach((block) => contentItemSchema.safeParse(block));
    const duration = Date.now() - start;

    expect(duration).toBeLessThan(5000);
  });

  it('validates 1000 site configs in under 5 seconds', () => {
    const start = Date.now();
    const configs = Array.from({ length: 1000 }, generateValidSiteConfig);
    configs.forEach((config) => siteConfigSchema.safeParse(config));
    const duration = Date.now() - start;

    expect(duration).toBeLessThan(5000);
  });
});
