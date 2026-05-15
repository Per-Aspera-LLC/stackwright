---
"@stackwright/collections": patch
---

chore(collections): remove duplicate CollectionProvider definitions

`file-collection-provider.ts` now imports `CollectionProvider`, `CollectionEntry`,
`CollectionListOptions`, and `CollectionListResult` directly from `@stackwright/types`
rather than from the local `./types` file.

`types.ts` is converted to a re-export shim so any unexpected downstream imports
remain backward-compatible. This completes the Phase 1 cleanup from the
types-hierarchy-refactor.
