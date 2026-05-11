---
"@stackwright/types": patch
"@stackwright/hooks-registry": patch
---

fix(types): move scaffold hook interfaces from hooks-registry to types

Moves `ScaffoldHookType`, `ScaffoldHook`, `ScaffoldHookContext`, and the new
`HookHandler` type alias into `@stackwright/types` — the canonical home for
interface contracts in the OSS stack.

`@stackwright/hooks-registry` re-exports all four types unchanged, so existing
imports from `hooks-registry` or `scaffold-core` continue to work without any
consumer changes required.

This eliminates the last remaining case where a framework contract was defined
in an implementing package rather than in `@stackwright/types`.
