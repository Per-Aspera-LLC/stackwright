import { z } from 'zod';

/**
 * Environment variable reference patterns.
 * Supports both $VAR_NAME and ${VAR_NAME} formats.
 */
export const ENV_VAR_PATTERN = /^\$[A-Z_][A-Z0-9_]*$/;
export const BRACED_ENV_VAR_PATTERN = /^\$\{[A-Z_][A-Z0-9_]*\}$/;

/**
 * Schema for environment variable references.
 * Enforces $VAR_NAME or ${VAR_NAME} pattern.
 */
export const envVarRefSchema = z
  .string()
  .regex(ENV_VAR_PATTERN, 'Must be env var reference like $API_TOKEN or ${API_TOKEN}')
  .or(z.string().regex(BRACED_ENV_VAR_PATTERN));

/**
 * Schema for authentication token values.
 *
 * This schema accepts ANY non-empty string for DX flexibility.
 * Runtime validation (via checkForPlaintextSecret) warns when
 * plaintext secrets are detected.
 *
 * Ideal flow: Use $ENV_VAR references in YAML, resolve at build time.
 */
export const authTokenSchema = z
  .string()
  .min(1)
  .describe(
    'Token value or env var reference ($TOKEN). ' + 'Use $VAR_NAME format for env var references.'
  );

/**
 * Schema for integration authentication config.
 */
export const integrationAuthSchema = z
  .object({
    type: z.enum(['bearer', 'apiKey', 'oauth2', 'basic', 'none']),
    token: authTokenSchema.optional(),
    value: authTokenSchema.optional(),
    apiKeyHeader: z.string().optional(),
    username: z.string().optional(),
    password: authTokenSchema.optional(),
  })
  .optional();

/**
 * Extract variable name from env var reference.
 */
export function extractEnvVarName(ref: string): string | null {
  const match = ref.match(/^\$([A-Z_][A-Z0-9_]*)$/) || ref.match(/^\$\{([A-Z_][A-Z0-9_]*)\}$/);
  return match ? match[1] : null;
}

/**
 * Resolve an env var reference to its actual value.
 */
export function resolveEnvVar(ref: string): string {
  const varName = extractEnvVarName(ref);
  if (!varName) return ref;

  const value = process.env[varName];
  if (value === undefined) {
    throw new Error(
      `Environment variable ${varName} is not set. ` + `Set it with: export ${varName}=<value>`
    );
  }
  if (value === '') {
    throw new Error(
      `Environment variable ${varName} is set but empty. ` + `Please set it to a non-empty value.`
    );
  }
  return value;
}

/**
 * Recursively resolve all env var references in an object.
 */
export function resolveEnvVarsDeep(obj: unknown): unknown {
  if (typeof obj === 'string') {
    return resolveEnvVar(obj);
  }
  if (Array.isArray(obj)) {
    return obj.map((item) => resolveEnvVarsDeep(item));
  }
  if (obj !== null && typeof obj === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      result[key] = resolveEnvVarsDeep(value);
    }
    return result;
  }
  return obj;
}

export type AuthToken = z.infer<typeof authTokenSchema>;
export type IntegrationAuth = z.infer<typeof integrationAuthSchema>;
