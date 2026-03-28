import { describe, it, expect } from 'vitest';
import { siteConfigSchema } from '../src/types/siteConfig';

describe('siteConfigSchema - integrations field', () => {
  // Base valid config for testing
  const baseConfig = {
    title: 'Test Site',
    navigation: [],
    appBar: {
      titleText: 'Test',
    },
  };

  describe('valid configurations', () => {
    it('should accept config without integrations field', () => {
      const result = siteConfigSchema.safeParse(baseConfig);
      expect(result.success).toBe(true);
    });

    it('should accept empty integrations array', () => {
      const config = { ...baseConfig, integrations: [] };
      const result = siteConfigSchema.safeParse(config);
      expect(result.success).toBe(true);
    });

    it('should accept valid OpenAPI integration with minimal fields', () => {
      const config = {
        ...baseConfig,
        integrations: [{ type: 'openapi', name: 'my-api' }],
      };
      const result = siteConfigSchema.safeParse(config);
      expect(result.success).toBe(true);
    });

    it('should accept valid OpenAPI integration with all fields (passthrough)', () => {
      const config = {
        ...baseConfig,
        integrations: [
          {
            type: 'openapi',
            name: 'logistics',
            spec: './specs/api.yaml',
            auth: { type: 'bearer', token: '$API_TOKEN' },
            collections: [{ endpoint: '/equipment', slug_field: 'id' }],
          },
        ],
      };
      const result = siteConfigSchema.safeParse(config);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.integrations![0]).toHaveProperty('spec');
        expect(result.data.integrations![0]).toHaveProperty('auth');
        expect(result.data.integrations![0]).toHaveProperty('collections');
      }
    });

    it('should accept multiple integrations of different types', () => {
      const config = {
        ...baseConfig,
        integrations: [
          { type: 'openapi', name: 'api1' },
          { type: 'graphql', name: 'api2' },
          { type: 'rest', name: 'api3' },
        ],
      };
      const result = siteConfigSchema.safeParse(config);
      expect(result.success).toBe(true);
    });

    it('should accept GraphQL integration type', () => {
      const config = {
        ...baseConfig,
        integrations: [{ type: 'graphql', name: 'my-graphql' }],
      };
      const result = siteConfigSchema.safeParse(config);
      expect(result.success).toBe(true);
    });

    it('should accept REST integration type', () => {
      const config = {
        ...baseConfig,
        integrations: [{ type: 'rest', name: 'my-rest' }],
      };
      const result = siteConfigSchema.safeParse(config);
      expect(result.success).toBe(true);
    });

    it('should accept real-world OpenAPI config from stackwright-pro docs', () => {
      const config = {
        ...baseConfig,
        integrations: [
          {
            type: 'openapi',
            name: 'logistics',
            spec: './specs/logistics-api.yaml',
            auth: {
              type: 'bearer',
              token: '$API_TOKEN',
            },
            collections: [
              { endpoint: '/equipment', slug_field: 'id' },
              { endpoint: '/supplies', slug_field: 'id' },
            ],
          },
        ],
      };
      const result = siteConfigSchema.safeParse(config);
      expect(result.success).toBe(true);
      if (result.success) {
        const integration = result.data.integrations![0];
        expect(integration.name).toBe('logistics');
        expect(integration.type).toBe('openapi');
        // Verify passthrough fields preserved
        expect(integration).toHaveProperty('spec');
        expect(integration).toHaveProperty('auth');
        expect(integration).toHaveProperty('collections');
      }
    });

    it('should accept multiple API integrations', () => {
      const config = {
        ...baseConfig,
        integrations: [
          {
            type: 'openapi',
            name: 'users',
            spec: './specs/users-api.yaml',
            collections: [{ endpoint: '/users', slug_field: 'id' }],
          },
          {
            type: 'openapi',
            name: 'orders',
            spec: './specs/orders-api.yaml',
            collections: [{ endpoint: '/orders', slug_field: 'order_id' }],
          },
        ],
      };
      const result = siteConfigSchema.safeParse(config);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.integrations).toHaveLength(2);
        expect(result.data.integrations![0].name).toBe('users');
        expect(result.data.integrations![1].name).toBe('orders');
      }
    });
  });

  describe('invalid configurations', () => {
    it('should reject integration missing type field', () => {
      const config = {
        ...baseConfig,
        integrations: [{ name: 'my-api' }],
      };
      const result = siteConfigSchema.safeParse(config);
      expect(result.success).toBe(false);
      if (!result.success) {
        // Zod v4 returns a discriminated union error
        expect(result.error.issues[0].message).toMatch(/openapi|graphql|rest/);
      }
    });

    it('should reject integration missing name field', () => {
      const config = {
        ...baseConfig,
        integrations: [{ type: 'openapi' }],
      };
      const result = siteConfigSchema.safeParse(config);
      expect(result.success).toBe(false);
      if (!result.success) {
        // Zod v4 returns a generic string validation error
        expect(result.error.issues[0].message).toMatch(/string|required/);
      }
    });

    it('should reject integration with empty name', () => {
      const config = {
        ...baseConfig,
        integrations: [{ type: 'openapi', name: '' }],
      };
      const result = siteConfigSchema.safeParse(config);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('required');
      }
    });

    it('should reject invalid integration type', () => {
      const config = {
        ...baseConfig,
        integrations: [{ type: 'invalid-type', name: 'my-api' }],
      };
      const result = siteConfigSchema.safeParse(config);
      expect(result.success).toBe(false);
      if (!result.success) {
        const message = result.error.issues[0].message;
        expect(message).toMatch(/openapi|graphql|rest/);
      }
    });

    it('should reject non-array integrations value', () => {
      const config = {
        ...baseConfig,
        integrations: { type: 'openapi', name: 'my-api' },
      };
      const result = siteConfigSchema.safeParse(config);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('array');
      }
    });
  });

  describe('security features', () => {
    it('should accept environment variable references for secrets', () => {
      const config = {
        ...baseConfig,
        integrations: [
          {
            type: 'openapi',
            name: 'secure-api',
            auth: {
              type: 'bearer',
              token: '$API_TOKEN', // Env var reference
            },
          },
        ],
      };
      const result = siteConfigSchema.safeParse(config);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.integrations![0]).toHaveProperty('auth');
        // @ts-ignore - checking passthrough field
        expect(result.data.integrations![0].auth.token).toBe('$API_TOKEN');
      }
    });

    it('should accept various environment variable patterns', () => {
      const envVarPatterns = [
        '$API_TOKEN',
        '$DATABASE_URL',
        '$MY_SECRET_KEY_123',
        '${API_TOKEN}',
        '${DATABASE_URL}',
      ];

      envVarPatterns.forEach((pattern) => {
        const config = {
          ...baseConfig,
          integrations: [
            {
              type: 'openapi',
              name: 'test-api',
              auth: { type: 'bearer', token: pattern },
            },
          ],
        };
        const result = siteConfigSchema.safeParse(config);
        expect(result.success).toBe(true, `Pattern "${pattern}" should be accepted`);
        if (result.success) {
          // @ts-ignore - checking passthrough field
          expect(result.data.integrations![0].auth.token).toBe(pattern);
        }
      });
    });
  });

  describe('error message quality', () => {
    it('should provide helpful error for invalid integration type', () => {
      const config = {
        ...baseConfig,
        integrations: [{ type: 'notreal', name: 'my-api' }],
      };
      const result = siteConfigSchema.safeParse(config);
      expect(result.success).toBe(false);
      if (!result.success) {
        const errorMessage = result.error.issues[0].message;
        console.log('Error message for invalid type:', errorMessage);
        // Should mention valid options
        expect(errorMessage.toLowerCase()).toMatch(/openapi|graphql|rest/);
      }
    });

    it('should provide helpful error for missing name', () => {
      const config = {
        ...baseConfig,
        integrations: [{ type: 'openapi' }],
      };
      const result = siteConfigSchema.safeParse(config);
      expect(result.success).toBe(false);
      if (!result.success) {
        const errorMessage = result.error.issues[0].message;
        console.log('Error message for missing name:', errorMessage);
        // Zod v4 says "expected string, received undefined" which is clear
        expect(errorMessage.toLowerCase()).toMatch(/string|undefined/);
      }
    });

    it('should show full validation path in complex config', () => {
      const config = {
        ...baseConfig,
        integrations: [
          { type: 'openapi', name: 'good-one' },
          { type: 'invalid', name: 'bad-one' }, // Second one is invalid
        ],
      };
      const result = siteConfigSchema.safeParse(config);
      expect(result.success).toBe(false);
      if (!result.success) {
        const issue = result.error.issues[0];
        console.log('Error path:', issue.path);
        console.log('Error message:', issue.message);
        // Should indicate which integration has the error
        expect(issue.path).toContain('integrations');
      }
    });
  });
});
