---
"@stackwright/hooks-registry": patch
"@stackwright/scaffold-core": patch
---

fix(scaffold-core): export HookHandler type from hooks-registry and scaffold-core

`HookHandler` is the canonical type alias for scaffold hook handler functions,
defined in `@stackwright/types`. It was re-exported by `hooks-registry/src/hooks.ts`
but not forwarded through `index.ts`, making it unavailable via the public package
import paths.

Both `@stackwright/hooks-registry` and `@stackwright/scaffold-core` now re-export
`HookHandler` alongside the other scaffold hook types. This completes Phase 1 step 4
of the types-hierarchy-refactor.
