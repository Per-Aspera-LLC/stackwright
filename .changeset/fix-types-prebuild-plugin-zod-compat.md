---
"@stackwright/types": patch
---

fix(types): remove zod internals from PrebuildPlugin public interface

`PrebuildPlugin.configSchema` was typed as `z.ZodSchema` and
`contentItemSchemas` as `z.ZodTypeAny[]`. These zod-version-specific
types bled into the published `.d.ts`, causing TypeScript errors in Pro
packages that implemented `PrebuildPlugin` when their installed zod version
differed from what `@stackwright/types` was built with.

Both fields now use a local structural `ZodLike` interface
(`{ safeParse(data: unknown): { success: boolean; error?: unknown } }`)
which any real Zod schema satisfies via duck-typing. Existing plugin
implementations are unaffected.

This is the same fix applied to `@stackwright/core`'s `ContentTypeEntry`
in the companion changeset.
