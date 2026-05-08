---
"@stackwright/types": minor
"@stackwright/collections": patch
"@stackwright/core": patch
---

Move `CollectionProvider`, `CollectionEntry`, `CollectionListOptions`, and
`CollectionListResult` interface contracts from `@stackwright/collections` into
`@stackwright/types`.

`@stackwright/collections` re-exports all four types from `@stackwright/types`
so existing imports are fully backwards-compatible — no consumer changes required.

This makes the interface contract accessible to Pro packages and other consumers
without requiring a dependency on any implementing package.
