---
"@stackwright/types": patch
---

fix(types): restore full Zod validation for buttonContentSchema.icon

Extracts a media-primitives.ts leaf module (no imports from base.ts) that
defines a standalone mediaItemSchema, breaking the circular initialisation
between base.ts and media.ts. buttonContentSchema.icon is now validated as
a proper discriminated union instead of z.any().
