---
"@stackwright/cli": patch
---

feat(cli): generate-agent-docs now emits an interface contracts table

A new auto-generated section in AGENTS.md documents the TypeScript interface
contracts defined in `@stackwright/types`:

- CollectionProvider, CollectionEntry, CollectionListOptions, CollectionListResult
- ScaffoldHookContext, ScaffoldHook, HookHandler, ScaffoldHookType

The section is delimited by `<!-- stackwright:interface-table:start/end -->` markers
and updated by `pnpm stackwright -- generate-agent-docs` alongside the existing
content-type-table. This completes Phase 1 step 8 of the types-hierarchy-refactor.
