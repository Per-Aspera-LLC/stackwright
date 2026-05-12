# @stackwright/hooks-registry

## 0.1.1-alpha.1

### Patch Changes

- b9a482b: fix(types): move scaffold hook interfaces from hooks-registry to types

  Moves `ScaffoldHookType`, `ScaffoldHook`, `ScaffoldHookContext`, and the new
  `HookHandler` type alias into `@stackwright/types` — the canonical home for
  interface contracts in the OSS stack.

  `@stackwright/hooks-registry` re-exports all four types unchanged, so existing
  imports from `hooks-registry` or `scaffold-core` continue to work without any
  consumer changes required.

  This eliminates the last remaining case where a framework contract was defined
  in an implementing package rather than in `@stackwright/types`.

- Updated dependencies [b9a482b]
  - @stackwright/types@1.5.0-alpha.2

## 0.1.1-alpha.0

### Patch Changes

- c18b6a1: Add `prepublishOnly` workspace protocol guard to all publishable packages to prevent accidentally publishing with unresolved `workspace:*` specifiers.

  Also removes a stale `@stackwright/collections` dependency from `@stackwright/core` (never imported, caused `ERR_PNPM_WORKSPACE_PKG_NOT_FOUND` when installing the published package), and fixes `@stackwright/maplibre` peer dependency on `@stackwright/core` from `workspace:*` to `>=0.8.0`.
