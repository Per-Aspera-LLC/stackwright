/**
 * Minimal structural interface that replaces z.ZodTypeAny in @stackwright/core's
 * public API surface.
 *
 * Using this instead of z.ZodTypeAny prevents zod's internal type machinery
 * (e.g. z.core.$strip, z.ZodObject generic parameters) from bleeding into the
 * published .d.ts file. Any real Zod schema satisfies this interface via
 * structural typing, so existing call-sites are unaffected.
 *
 * @see https://github.com/Per-Aspera-LLC/stackwright/issues — "fix core d.ts against zod@4"
 */
export interface ZodSchema {
  safeParse(data: unknown): { success: boolean; error?: { issues: unknown[] } };
}
