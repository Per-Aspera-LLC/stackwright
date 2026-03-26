import { describe, it, expect } from 'vitest';
import { siteConfigSchema } from '../src/types/siteConfig';

describe('Integration Security: CRITICAL-01 Path Traversal Protection', () => {
  // Base valid config for testing
  const baseConfig = {
    title: 'Test Site',
    navigation: [],
    appBar: {
      titleText: 'Test',
    },
  };

  describe('path traversal attacks', () => {
    it('should reject path traversal with ../', () => {
      const config = {
        ...baseConfig,
        integrations: [{ type: 'openapi', name: '../../../etc/passwd' }],
      };
      const result = siteConfigSchema.safeParse(config);
      expect(result.success).toBe(false);
      if (!result.success) {
        const message = result.error.issues[0].message;
        expect(message.toLowerCase()).toMatch(/path traversal|kebab-case|alphanumeric/);
      }
    });

    it('should reject path traversal with ..', () => {
      const config = {
        ...baseConfig,
        integrations: [{ type: 'openapi', name: 'bad..name' }],
      };
      const result = siteConfigSchema.safeParse(config);
      expect(result.success).toBe(false);
      if (!result.success) {
        const message = result.error.issues[0].message;
        // Regex catches this first (consecutive dots aren't alphanumeric)
        expect(message.toLowerCase()).toMatch(/path traversal|kebab-case/);
      }
    });

    it('should reject absolute paths starting with /', () => {
      const config = {
        ...baseConfig,
        integrations: [{ type: 'openapi', name: '/etc/shadow' }],
      };
      const result = siteConfigSchema.safeParse(config);
      expect(result.success).toBe(false);
      if (!result.success) {
        const message = result.error.issues[0].message;
        expect(message.toLowerCase()).toMatch(/path traversal|kebab-case/);
      }
    });

    it('should reject Windows-style paths with backslashes', () => {
      const config = {
        ...baseConfig,
        integrations: [{ type: 'openapi', name: 'bad\\name' }],
      };
      const result = siteConfigSchema.safeParse(config);
      expect(result.success).toBe(false);
      if (!result.success) {
        const message = result.error.issues[0].message;
        // Regex catches this first (backslash isn't alphanumeric)
        expect(message.toLowerCase()).toMatch(/path traversal|kebab-case/);
      }
    });
  });

  describe('kebab-case enforcement', () => {
    it('should reject names with uppercase letters', () => {
      const config = {
        ...baseConfig,
        integrations: [{ type: 'openapi', name: 'BadName' }],
      };
      const result = siteConfigSchema.safeParse(config);
      expect(result.success).toBe(false);
      if (!result.success) {
        const message = result.error.issues[0].message;
        expect(message.toLowerCase()).toMatch(/kebab-case|lowercase/);
      }
    });

    it('should reject names with underscores', () => {
      const config = {
        ...baseConfig,
        integrations: [{ type: 'openapi', name: 'bad_name' }],
      };
      const result = siteConfigSchema.safeParse(config);
      expect(result.success).toBe(false);
      if (!result.success) {
        const message = result.error.issues[0].message;
        expect(message.toLowerCase()).toMatch(/kebab-case|alphanumeric/);
      }
    });

    it('should reject names with leading hyphens', () => {
      const config = {
        ...baseConfig,
        integrations: [{ type: 'openapi', name: '-bad-name' }],
      };
      const result = siteConfigSchema.safeParse(config);
      expect(result.success).toBe(false);
      if (!result.success) {
        const message = result.error.issues[0].message;
        expect(message.toLowerCase()).toMatch(/kebab-case|leading/);
      }
    });

    it('should reject names with trailing hyphens', () => {
      const config = {
        ...baseConfig,
        integrations: [{ type: 'openapi', name: 'bad-name-' }],
      };
      const result = siteConfigSchema.safeParse(config);
      expect(result.success).toBe(false);
      if (!result.success) {
        const message = result.error.issues[0].message;
        expect(message.toLowerCase()).toMatch(/kebab-case|trailing/);
      }
    });

    it('should reject names with special characters', () => {
      const badNames = ['bad@name', 'bad.name', 'bad!name', 'bad#name'];

      badNames.forEach((name) => {
        const config = {
          ...baseConfig,
          integrations: [{ type: 'openapi', name }],
        };
        const result = siteConfigSchema.safeParse(config);
        expect(result.success).toBe(false);
      });
    });
  });

  describe('length validation', () => {
    it('should reject names exceeding 50 characters', () => {
      const config = {
        ...baseConfig,
        integrations: [
          {
            type: 'openapi',
            name: 'a'.repeat(51), // 51 characters
          },
        ],
      };
      const result = siteConfigSchema.safeParse(config);
      expect(result.success).toBe(false);
      if (!result.success) {
        const message = result.error.issues[0].message;
        expect(message).toMatch(/50/);
      }
    });

    it('should reject single character names (need at least 2)', () => {
      const config = {
        ...baseConfig,
        integrations: [{ type: 'openapi', name: 'a' }],
      };
      const result = siteConfigSchema.safeParse(config);
      expect(result.success).toBe(false);
      if (!result.success) {
        const message = result.error.issues[0].message;
        expect(message.toLowerCase()).toMatch(/kebab-case|alphanumeric/);
      }
    });

    it('should accept name at exactly 50 characters', () => {
      const config = {
        ...baseConfig,
        integrations: [
          {
            type: 'openapi',
            name: 'a'.repeat(50), // Exactly 50 characters
          },
        ],
      };
      const result = siteConfigSchema.safeParse(config);
      expect(result.success).toBe(true);
    });
  });

  describe('valid names (positive tests)', () => {
    it('should accept valid kebab-case names', () => {
      const validNames = [
        'api',
        'my-api',
        'logistics-v2',
        'user-management-api',
        'api123',
        '123api',
        'a1-b2-c3',
        'api-v1',
        'graphql-api',
      ];

      validNames.forEach((name) => {
        const config = {
          ...baseConfig,
          integrations: [{ type: 'openapi', name }],
        };
        const result = siteConfigSchema.safeParse(config);
        expect(result.success).toBe(true, `Expected "${name}" to be valid`);
      });
    });

    it('should accept two-character names', () => {
      const config = {
        ...baseConfig,
        integrations: [{ type: 'openapi', name: 'ab' }],
      };
      const result = siteConfigSchema.safeParse(config);
      expect(result.success).toBe(true);
    });
  });

  describe('combined security scenarios', () => {
    it('should reject multiple path traversal techniques combined', () => {
      const maliciousNames = [
        '../secrets',
        'api/../etc',
        '../../root',
        'api/../../etc/passwd',
        '/var/log/app',
        '\\windows\\system32',
      ];

      maliciousNames.forEach((name) => {
        const config = {
          ...baseConfig,
          integrations: [{ type: 'openapi', name }],
        };
        const result = siteConfigSchema.safeParse(config);
        expect(result.success).toBe(false, `Expected "${name}" to be rejected`);
      });
    });
  });
});
