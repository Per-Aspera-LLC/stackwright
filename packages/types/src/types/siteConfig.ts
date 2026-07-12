import { z } from 'zod';
import { navigationItemSchema } from './navigation';
import { buttonContentSchema } from './base';
import { mediaItemSchema } from './media';
import { themeSchema } from '@stackwright/themes/schemas';
import { integrationAuthSchema } from './secrets';

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
 * - `websocket`: WebSocket streaming connections → real-time push updates via `useStreaming`
 * - `sse`: Server-Sent Events connections → real-time push updates through HTTP-compatible proxies/firewalls
 *
 * Each integration requires:
 * - `type`: Integration type (determines which plugin processes this config)
 * - `name`: Unique identifier (used for generated code paths, e.g., src/generated/{name}/)
 *
 * Additional fields are plugin-specific and passed through via `.passthrough()`.
 * See individual plugin docs for their configuration options.
 *
 *  **Security Note:**
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
 *
 * @example
 * ```yaml
 * integrations:
 *   - type: websocket
 *     name: vessel-tracking
 *     url: wss://ais-api.example.com/stream
 *     reconnectInterval: 3000
 *     maxRetries: 10
 *     auth:
 *       type: bearer
 *       token: $AIS_TOKEN
 * ```
 */
export const integrationConfigSchema = z
  .object({
    /** Integration type - determines which plugin processes this config */
    type: z.enum(['openapi', 'graphql', 'rest', 'websocket', 'sse']),
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
    /** Optional authentication configuration for this integration. */
    auth: integrationAuthSchema,
    /** Transport protocol. Defaults to 'polling' for rest/openapi/graphql. Auto-detected for websocket/sse types. */
    transport: z.enum(['polling', 'websocket', 'sse']).optional(),
    /** Reconnect interval in ms for streaming transports (default: 3000, min: 1000, max: 60000). */
    reconnectInterval: z.number().int().min(1000).max(60000).optional(),
    /** Max reconnect attempts before giving up (default: 5). */
    maxRetries: z.number().int().min(0).max(100).optional(),
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

/**
 * Font loading strategy configuration.
 *
 * Controls how web fonts are loaded in generated sites:
 * - `external` (default): Links to Google Fonts CDN at runtime. Suitable for
 *   public-internet sites where CDN performance is desirable.
 * - `bundle`: Downloads font files from Google Fonts at build time and serves
 *   them from `public/fonts/`. No outbound font requests at runtime.
 * - `local`: Uses pre-provided font files. Set `local_path` to a CSS file that
 *   declares `@font-face` rules. Required for air-gapped build AND deploy environments.
 *
 * @example
 * ```yaml
 * fonts:
 *   strategy: bundle          # download at build time, serve locally
 * ```
 *
 * @example
 * ```yaml
 * fonts:
 *   strategy: local
 *   local_path: /fonts/fonts.css   # your pre-provided @font-face CSS
 * ```
 */
export const fontsConfigSchema = z
  .object({
    strategy: z.enum(['external', 'bundle', 'local']).default('external'),
    /** Path to a local CSS file declaring @font-face rules. Required when strategy is "local". */
    local_path: z.string().optional(),
  })
  .refine((v) => v.strategy !== 'local' || !!v.local_path, {
    message: 'local_path is required when strategy is "local"',
    path: ['local_path'],
  });

/**
 * Image optimization pipeline configuration.
 *
 * Controls how the `stackwright-prebuild` script processes images:
 * - WebP and/or AVIF variants are generated alongside the original.
 * - Blur placeholders (tiny base64-encoded data URIs) are generated for
 *   use as `placeholder="blur"` in `NextStackwrightImage`.
 * - Images wider than `maxWidth` are downscaled.
 *
 * @example
 * ```yaml
 * imageOptimization:
 *   enabled: true
 *   formats: [webp]
 *   quality: 80
 *   maxWidth: 1920
 *   blur: true
 *   blurSize: 10
 * ```
 */
export const imageOptimizationConfigSchema = z.object({
  /** Enable/disable image optimization. Defaults to true. */
  enabled: z.boolean().default(true),
  /** Output formats to generate alongside the original. */
  formats: z.array(z.enum(['webp', 'avif'])).default(['webp']),
  /** Quality for generated variants (1-100). */
  quality: z.number().int().min(1).max(100).default(80),
  /** Maximum width in pixels. Images wider than this are downscaled. */
  maxWidth: z.number().int().min(1).default(1920),
  /** Generate blur placeholders as base64 data URIs. */
  blur: z.boolean().default(true),
  /** Width in pixels for the tiny blur placeholder image. */
  blurSize: z.number().int().min(4).max(64).default(10),
});

export const localesConfigSchema = z.object({
  /** BCP 47 default locale tag, e.g. "en", "fr", "de". */
  default: z.string().default('en'),
  /** All supported locale tags including the default. */
  supported: z.array(z.string()).min(1),
});

/**
 * Prebuild pipeline configuration (optional section in stackwright.yml).
 *
 * Controls build-time plugin discovery and validation behavior.
 * The `unknownContentTypes` field is schema-only in this release —
 * behavior threading is tracked separately.
 */
export const prebuildConfigSchema = z
  .object({
    /**
     * Additional plugin package names to load during prebuild (Tier B discovery).
     * Each name must be resolvable from the project's node_modules.
     * Typos here are hard errors — the build fails loudly.
     */
    plugins: z.array(z.string()).optional(),
    /**
     * How to handle unknown content types encountered during validation.
     * Schema-only — behavior threading is out of scope for this release.
     */
    unknownContentTypes: z.enum(['error', 'warn', 'ignore']).optional(),
  })
  .optional();

export const siteConfigSchema = z.object({
  title: z.string(),
  meta: siteMetaSchema.optional(),
  themeName: z.string().optional(),
  customTheme: themeSchema.optional(),
  navigation: z.array(navigationItemSchema),
  appBar: appBarConfigSchema,
  footer: footerConfigSchema.optional(),
  breakpoints: breakpointsConfigSchema.optional(),
  /** Optional array of Pro package integrations (OpenAPI, GraphQL, REST, WebSocket, SSE). See integrationConfigSchema for details. */
  integrations: z.array(integrationConfigSchema).optional(),
  /** Optional sidebar navigation configuration. When present, a sidebar will be rendered on all pages. */
  sidebar: sidebarConfigSchema.optional(),
  /** Optional search configuration. When present, a search modal will be available via Cmd+K. */
  search: searchConfigSchema.optional(),
  /** Optional font loading strategy configuration. Controls how web fonts are loaded. */
  fonts: fontsConfigSchema.optional(),
  /** Optional image optimization configuration for the prebuild pipeline. */
  imageOptimization: imageOptimizationConfigSchema.optional(),
  /** Optional locale configuration for multi-language content support. */
  locales: localesConfigSchema.optional(),
  /** Optional prebuild pipeline configuration for plugin discovery and validation. */
  prebuild: prebuildConfigSchema,
});

export type SiteMeta = z.infer<typeof siteMetaSchema>;
export type AppBarConfig = z.infer<typeof appBarConfigSchema>;
export type BreakpointsConfig = z.infer<typeof breakpointsConfigSchema>;
export type FooterConfig = z.infer<typeof footerConfigSchema>;
export type IntegrationConfig = z.infer<typeof integrationConfigSchema>;
export type SidebarConfig = z.infer<typeof sidebarConfigSchema>;
export type SearchConfig = z.infer<typeof searchConfigSchema>;
export type FontsConfig = z.infer<typeof fontsConfigSchema>;
export type ImageOptimizationConfig = z.infer<typeof imageOptimizationConfigSchema>;
export type LocalesConfig = z.infer<typeof localesConfigSchema>;
export type PrebuildConfig = z.infer<typeof prebuildConfigSchema>;
export type SiteConfig = z.infer<typeof siteConfigSchema>;
