import { z } from 'zod';
import { navigationItemSchema } from './navigation';
import { buttonContentSchema } from './base';
import { mediaItemSchema } from './media';
import { themeSchema } from '@stackwright/themes';

export const appBarConfigSchema = z.object({
  titleText: z.string(),
  backgroundColor: z.string().optional(),
  textColor: z.string().optional(),
  logo: mediaItemSchema.optional(),
  height: z.string().optional(),
  menuItems: z.array(navigationItemSchema).optional(),
  /** Show a Sun/Moon toggle for switching between light and dark color modes. */
  colorModeToggle: z.boolean().optional(),
});

export const breakpointsConfigSchema = z.object({
  xs: z.string(),
  sm: z.string(),
  md: z.string(),
  lg: z.string(),
  xl: z.string(),
});

export const footerConfigSchema = z.object({
  backgroundColor: z.string().optional(),
  textColor: z.string().optional(),
  copyright: z.string().optional(),
  itemsPerColumn: z.number().optional(),
  links: z.array(navigationItemSchema).optional(),
  socialLinks: z.array(buttonContentSchema).optional(),
  socialText: z.string().optional(),
});

export const siteMetaSchema = z.object({
  description: z.string().optional(),
  og_image: z.string().optional(),
  og_site_name: z.string().optional(),
  base_url: z.string().url().optional(),
});

/**
 * Integration config schema for Pro package integrations.
 *
 * Supports third-party API integrations that generate typed code at build time:
 * - `openapi`: OpenAPI 3.x specifications → Zod schemas + TypeScript types + API clients
 * - `graphql`: GraphQL schemas → typed queries + mutations
 * - `rest`: REST APIs → collection providers + typed endpoints
 *
 * Each integration requires:
 * - `type`: Integration type (determines which plugin processes this config)
 * - `name`: Unique identifier (used for generated code paths, e.g., src/generated/{name}/)
 *
 * Additional fields are plugin-specific and passed through via `.passthrough()`.
 * See individual plugin docs for their configuration options.
 *
 * ⚠️ **Security Note:**
 * - Integration names are validated to prevent path traversal attacks
 * - API tokens should use environment variable references (e.g., `$API_TOKEN`)
 * - Never commit plaintext secrets to YAML files
 *
 * @example
 * ```yaml
 * integrations:
 *   - type: openapi
 *     name: logistics      # Must be kebab-case, no path traversal
 *     spec: ./specs/api.yaml
 *     auth:
 *       type: bearer
 *       token: $API_TOKEN  # Environment variable reference
 * ```
 */
export const integrationConfigSchema = z
  .object({
    /** Integration type - determines which plugin processes this config */
    type: z.enum(['openapi', 'graphql', 'rest']),
    /**
     * Unique name for this integration (used for generated code paths).
     * Must be lowercase alphanumeric with hyphens (kebab-case).
     * No leading/trailing hyphens or path traversal sequences allowed.
     */
    name: z
      .string()
      .min(1, 'Integration name is required')
      .max(50, 'Integration name must be ≤50 characters')
      .regex(
        /^[a-z0-9][a-z0-9-]*[a-z0-9]$/,
        'Integration name must be lowercase alphanumeric with hyphens (kebab-case), no leading/trailing hyphens'
      )
      .refine(
        (name) => !name.includes('..') && !name.startsWith('/') && !name.includes('\\'),
        'Integration name cannot contain path traversal sequences'
      ),
  })
  .passthrough();

export const sidebarConfigSchema = z.object({
  navigation: z.array(navigationItemSchema),
  collapsed: z.boolean().optional().default(false),
  width: z.number().optional().default(240),
  mobileBreakpoint: z.number().optional().default(768),
  backgroundColor: z.string().optional(),
  textColor: z.string().optional(),
});

export const searchConfigSchema = z.object({
  /** Enable or disable search functionality. Defaults to true. */
  enabled: z.boolean().default(true),
  /** Placeholder text shown in the search input. */
  placeholder: z.string().default('Search...'),
  /** Keyboard shortcut key (without modifier). Defaults to 'k' for Cmd+K. */
  shortcut: z.string().default('k'),
});

export const siteConfigSchema = z.object({
  title: z.string(),
  meta: siteMetaSchema.optional(),
  themeName: z.string().optional(),
  customTheme: themeSchema.optional(),
  navigation: z.array(navigationItemSchema),
  appBar: appBarConfigSchema,
  footer: footerConfigSchema.optional(),
  breakpoints: breakpointsConfigSchema.optional(),
  /** Optional array of Pro package integrations (OpenAPI, GraphQL, REST). See integrationConfigSchema for details. */
  integrations: z.array(integrationConfigSchema).optional(),
  /** Optional sidebar navigation configuration. When present, a sidebar will be rendered on all pages. */
  sidebar: sidebarConfigSchema.optional(),
  /** Optional search configuration. When present, a search modal will be available via Cmd+K. */
  search: searchConfigSchema.optional(),
});

export type SiteMeta = z.infer<typeof siteMetaSchema>;
export type AppBarConfig = z.infer<typeof appBarConfigSchema>;
export type BreakpointsConfig = z.infer<typeof breakpointsConfigSchema>;
export type FooterConfig = z.infer<typeof footerConfigSchema>;
export type IntegrationConfig = z.infer<typeof integrationConfigSchema>;
export type SidebarConfig = z.infer<typeof sidebarConfigSchema>;
export type SearchConfig = z.infer<typeof searchConfigSchema>;
export type SiteConfig = z.infer<typeof siteConfigSchema>;
