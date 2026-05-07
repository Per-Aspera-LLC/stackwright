---
"@stackwright/core": patch
---

fix(core): remove zod internals from published .d.ts

The generated `dist/index.d.ts` previously embedded zod-version-specific
internal types (`z.ZodTypeAny`, `z.core.$strip`, `z.ZodObject` generics)
directly into the exported API surface. This caused TypeScript errors in
consumer projects whose installed zod version differed from the one used
at build time — particularly the zod@3 → zod@4 upgrade — forcing them to
maintain `stackwright-core.d.ts` module-override stubs as workarounds.

Two root causes fixed:

1. `ContentTypeEntry.schema` and the `registerContentType` / `getContentTypeSchema`
   signatures now use a local `ZodSchema` structural interface instead of
   `z.ZodTypeAny`. Any real Zod schema satisfies `ZodSchema` via duck-typing,
   so existing call-sites are unaffected.

2. `siteDefaults.ts` was importing `SiteConfig` via a relative path to the
   `@stackwright/types` source file, causing tsup to inline the entire
   `siteConfigSchema: z.ZodObject<{..., z.core.$strip}>` declaration into the
   bundled d.ts. Changed to `import type { SiteConfig } from '@stackwright/types'`
   so tsup treats it as an external package reference.

Additionally, `@stackwright/types`, `@stackwright/themes`, and
`@stackwright/collections` are now listed in tsup's `external` array as a
defensive measure against future inlining regressions.

Consumer projects can now delete any `stackwright-core.d.ts` stub override files.
