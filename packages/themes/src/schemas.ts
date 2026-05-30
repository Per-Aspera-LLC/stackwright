/**
 * Zod schema exports for @stackwright/themes.
 *
 * Import from '@stackwright/themes/schemas' — NOT from '@stackwright/themes'.
 * These are build/CLI/server-only utilities. Importing them in client-side
 * code will pull zod into the browser bundle.
 *
 * @example (server / CLI / prebuild only)
 *   import { themeConfigSchema } from '@stackwright/themes/schemas';
 */
export { colorsSchema, componentStyleSchema, themeConfigSchema, themeSchema } from './types';
