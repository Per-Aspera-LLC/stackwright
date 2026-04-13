import { z } from 'zod';
import { describe, it, expect } from 'vitest';
import type { PrebuildPlugin } from '../src/types/plugin.js';
import {
  ENV_VAR_PATTERN,
  BRACED_ENV_VAR_PATTERN,
  envVarRefSchema,
  authTokenSchema,
  integrationAuthSchema,
  extractEnvVarName,
  resolveEnvVar,
  resolveEnvVarsDeep,
} from '../src/types/secrets.js';
import { estimateEntropy, checkForPlaintextSecret } from '../src/types/secret-detection.js';

describe('Environment Variable Patterns', () => {
  describe('ENV_VAR_PATTERN', () => {
    it('should match $VAR_NAME format', () => {
      expect(ENV_VAR_PATTERN.test('$API_TOKEN')).toBe(true);
      expect(ENV_VAR_PATTERN.test('$DATABASE_URL')).toBe(true);
      expect(ENV_VAR_PATTERN.test('$MY_SECRET_123')).toBe(true);
    });

    it('should not match invalid patterns', () => {
      expect(ENV_VAR_PATTERN.test('$lowercase')).toBe(false);
      expect(ENV_VAR_PATTERN.test('$123NUM')).toBe(false);
      expect(ENV_VAR_PATTERN.test('API_TOKEN')).toBe(false);
      expect(ENV_VAR_PATTERN.test('$')).toBe(false);
    });
  });

  describe('BRACED_ENV_VAR_PATTERN', () => {
    it('should match ${VAR_NAME} format', () => {
      expect(BRACED_ENV_VAR_PATTERN.test('${API_TOKEN}')).toBe(true);
      expect(BRACED_ENV_VAR_PATTERN.test('${DATABASE_URL}')).toBe(true);
    });

    it('should not match invalid patterns', () => {
      expect(BRACED_ENV_VAR_PATTERN.test('${lowercase}')).toBe(false);
      expect(BRACED_ENV_VAR_PATTERN.test('$API_TOKEN')).toBe(false);
    });
  });
});

describe('EnvVarRefSchema', () => {
  it('should accept valid $VAR_NAME references', () => {
    const result = envVarRefSchema.safeParse('$API_TOKEN');
    expect(result.success).toBe(true);
  });

  it('should accept valid ${VAR_NAME} references', () => {
    const result = envVarRefSchema.safeParse('${API_TOKEN}');
    expect(result.success).toBe(true);
  });

  it('should reject invalid patterns', () => {
    const result = envVarRefSchema.safeParse('invalid');
    expect(result.success).toBe(false);
  });
});

describe('AuthTokenSchema', () => {
  it('should accept env var references', () => {
    expect(authTokenSchema.safeParse('$API_TOKEN').success).toBe(true);
    expect(authTokenSchema.safeParse('${API_TOKEN}').success).toBe(true);
  });

  it('should accept plaintext strings', () => {
    expect(authTokenSchema.safeParse('my-secret-value').success).toBe(true);
  });

  it('should reject empty strings', () => {
    const result = authTokenSchema.safeParse('');
    expect(result.success).toBe(false);
  });
});

describe('IntegrationAuthSchema', () => {
  it('should accept valid auth config with bearer token', () => {
    const result = integrationAuthSchema.safeParse({
      type: 'bearer',
      token: '$API_TOKEN',
    });
    expect(result.success).toBe(true);
  });

  it('should accept basic auth with username/password', () => {
    const result = integrationAuthSchema.safeParse({
      type: 'basic',
      username: 'admin',
      password: '$DB_PASSWORD',
    });
    expect(result.success).toBe(true);
  });

  it('should accept apiKey auth', () => {
    const result = integrationAuthSchema.safeParse({
      type: 'apiKey',
      token: '$API_KEY',
      apiKeyHeader: 'X-API-Key',
    });
    expect(result.success).toBe(true);
  });

  it('should accept none auth type', () => {
    const result = integrationAuthSchema.safeParse({
      type: 'none',
    });
    expect(result.success).toBe(true);
  });

  it('should allow auth to be undefined', () => {
    const result = integrationAuthSchema.safeParse(undefined);
    expect(result.success).toBe(true);
  });
});

describe('extractEnvVarName', () => {
  it('should extract variable name from $VAR format', () => {
    expect(extractEnvVarName('$API_TOKEN')).toBe('API_TOKEN');
    expect(extractEnvVarName('$MY_VAR_123')).toBe('MY_VAR_123');
  });

  it('should extract variable name from ${VAR} format', () => {
    expect(extractEnvVarName('${API_TOKEN}')).toBe('API_TOKEN');
  });

  it('should return null for non-env-var strings', () => {
    expect(extractEnvVarName('plaintext')).toBe(null);
    expect(extractEnvVarName('')).toBe(null);
  });
});

describe('resolveEnvVar', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('should resolve env var reference to actual value', () => {
    process.env.TEST_VAR = 'test-value';
    expect(resolveEnvVar('$TEST_VAR')).toBe('test-value');
  });

  it('should throw error for missing env var', () => {
    delete process.env.MISSING_VAR;
    expect(() => resolveEnvVar('$MISSING_VAR')).toThrow('MISSING_VAR is not set');
  });

  it('should return plaintext strings unchanged', () => {
    expect(resolveEnvVar('plaintext')).toBe('plaintext');
  });
});

describe('resolveEnvVarsDeep', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv, API_TOKEN: 'secret123' };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('should resolve env vars in objects', () => {
    const input = { token: '$API_TOKEN', name: 'api' };
    const result = resolveEnvVarsDeep(input);
    expect(result).toEqual({ token: 'secret123', name: 'api' });
  });

  it('should resolve env vars in arrays', () => {
    const input = ['$API_TOKEN', 'static-value'];
    const result = resolveEnvVarsDeep(input);
    expect(result).toEqual(['secret123', 'static-value']);
  });

  it('should handle nested structures', () => {
    const input = {
      auth: { token: '$API_TOKEN' },
      integrations: [{ name: 'api', key: '$API_TOKEN' }],
    };
    const result = resolveEnvVarsDeep(input);
    expect(result).toEqual({
      auth: { token: 'secret123' },
      integrations: [{ name: 'api', key: 'secret123' }],
    });
  });

  it('should preserve non-string values', () => {
    const input = { count: 42, enabled: true, items: [1, 2, 3] };
    const result = resolveEnvVarsDeep(input);
    expect(result).toEqual(input);
  });
});

describe('Entropy Detection', () => {
  describe('estimateEntropy', () => {
    it('should return 0 for empty string', () => {
      expect(estimateEntropy('')).toBe(0);
    });

    it('should return low entropy for repetitive text', () => {
      const entropy = estimateEntropy('aaaaaaaaaa');
      expect(entropy).toBeLessThan(1);
    });

    it('should return higher entropy for random strings', () => {
      // 18 unique chars → log2(18) ≈ 4.17 bits/char, safely above threshold of 4
      const entropy = estimateEntropy('aK8#mP2$vL5@nQ9!xZ');
      expect(entropy).toBeGreaterThan(4);
    });

    it('should return moderate entropy for normal words', () => {
      const entropy = estimateEntropy('password123');
      expect(entropy).toBeGreaterThan(2);
      expect(entropy).toBeLessThan(4);
    });
  });

  describe('checkForPlaintextSecret', () => {
    it('should return null for env var references', () => {
      expect(checkForPlaintextSecret('$API_TOKEN', 'token')).toBe(null);
    });

    it('should return warning for low entropy plaintext', () => {
      const result = checkForPlaintextSecret('password123', 'token');
      expect(result).toContain('SECURITY WARNING');
      expect(result).toContain('token');
    });

    it('should return null for short strings', () => {
      expect(checkForPlaintextSecret('short', 'token')).toBe(null);
    });

    it('should return null for high entropy random strings', () => {
      const result = checkForPlaintextSecret('aK8#mP2$vL5@nQ9', 'token');
      expect(result).toBe(null);
    });
  });
});

describe('Plugin Config Schema Validation', () => {
  // Mock integration config schema for testing
  const mockIntegrationSchema = z.object({
    spec: z.string(),
    timeout: z.number().optional(),
  });

  describe('PrebuildPlugin.configSchema', () => {
    it('should allow plugins to declare a configSchema', () => {
      const plugin: PrebuildPlugin = {
        name: 'integration-openapi',
        configSchema: mockIntegrationSchema,
      };
      expect(plugin.configSchema).toBeDefined();
      expect(plugin.configSchema?.parse).toBeDefined();
    });

    it('should validate correct config against schema', () => {
      const validConfig = { spec: './openapi.yaml', timeout: 5000 };
      const result = mockIntegrationSchema.safeParse(validConfig);
      expect(result.success).toBe(true);
    });

    it('should reject config missing required fields', () => {
      const invalidConfig = { timeout: 5000 }; // missing spec
      const result = mockIntegrationSchema.safeParse(invalidConfig);
      expect(result.success).toBe(false);
    });

    it('should reject config with wrong types', () => {
      const invalidConfig = { spec: './openapi.yaml', timeout: 'not-a-number' };
      const result = mockIntegrationSchema.safeParse(invalidConfig);
      expect(result.success).toBe(false);
    });

    it('should block prototype pollution attempts', () => {
      const maliciousConfig = {
        spec: './openapi.yaml',
        __proto__: { admin: true },
        constructor: { prototype: {} },
      };
      const result = mockIntegrationSchema.safeParse(maliciousConfig);
      // Zod strips unknown keys by default, so this should pass
      // but the __proto__ won't be added to the parsed object
      expect(result.success).toBe(true);
      if (result.success) {
        // Use Object.hasOwn to check for literal property (not prototype chain)
        expect(Object.hasOwn(result.data, '__proto__')).toBe(false);
        expect(Object.hasOwn(result.data, 'constructor')).toBe(false);
      }
    });

    it('should allow undefined configSchema (backward compatibility)', () => {
      const plugin: PrebuildPlugin = {
        name: 'integration-legacy',
        beforeBuild: async () => {},
      };
      expect(plugin.configSchema).toBeUndefined();
    });
  });

  describe('Integration schema security', () => {
    it('should strip __proto__ from parsed config', () => {
      const schema = z.object({
        name: z.string(),
      });
      const input = {
        name: 'test',
        __proto__: { pollution: true },
      };
      const result = schema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(Object.prototype.hasOwnProperty.call(result.data, '__proto__')).toBe(false);
      }
    });

    it('should strip constructor from parsed config', () => {
      const schema = z.object({
        name: z.string(),
      });
      const input = {
        name: 'test',
        constructor: { prototype: {} },
      };
      const result = schema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(Object.prototype.hasOwnProperty.call(result.data, 'constructor')).toBe(false);
      }
    });

    it('should strip prototype from parsed config', () => {
      const schema = z.object({
        name: z.string(),
      });
      const input = {
        name: 'test',
        prototype: {},
      };
      const result = schema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(Object.prototype.hasOwnProperty.call(result.data, 'prototype')).toBe(false);
      }
    });

    it('should handle nested malicious keys', () => {
      const schema = z.object({
        config: z.object({
          value: z.string(),
        }),
      });
      const input = {
        config: {
          value: 'test',
          __proto__: { evil: true },
        },
      };
      const result = schema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success && result.data.config) {
        expect(Object.prototype.hasOwnProperty.call(result.data.config, '__proto__')).toBe(false);
      }
    });
  });
});
