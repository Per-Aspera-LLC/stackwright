---
"@stackwright/types": patch
---

Export `ZodLike` from `@stackwright/types` so plugin authors can reference it by name without index-access workarounds. Also widens `ZodLike.issues[].path` from `(string | number)[]` to `PropertyKey[]` to match Zod v4's actual `$ZodIssue.path` type, fixing a nominal TypeScript incompatibility where real Zod schemas did not satisfy `ZodLike` at the type level.
