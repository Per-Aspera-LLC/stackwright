# @stackwright/hooks-registry

## 0.1.5-alpha.0

### Patch Changes

- Updated dependencies [98bc1f7]
  - @stackwright/types@1.9.0-alpha.0

## 0.1.4

### Patch Changes

- Updated dependencies [5e6d487]
- Updated dependencies [5e6d487]
  - @stackwright/types@1.8.0

## 0.1.4-alpha.1

### Patch Changes

- Updated dependencies [3bac6b8]
  - @stackwright/types@1.8.0-alpha.1

## 0.1.4-alpha.0

### Patch Changes

- Updated dependencies [803e6ea]
  - @stackwright/types@1.7.1-alpha.0

## 0.1.3

### Patch Changes

- Updated dependencies [7fc040f]
- Updated dependencies [7fc040f]
  - @stackwright/types@1.7.0

## 0.1.2

### Patch Changes

- Updated dependencies [cd5403d]
- Updated dependencies [f0bd272]
- Updated dependencies [cd5403d]
- Updated dependencies [a931eb3]
  - @stackwright/types@1.6.0

## 0.1.2-alpha.4

### Patch Changes

- Updated dependencies [510517c]
  - @stackwright/types@1.6.0-alpha.4

## 0.1.2-alpha.3

### Patch Changes

- Updated dependencies [ed64fab]
  - @stackwright/types@1.6.0-alpha.3

## 0.1.2-alpha.2

### Patch Changes

- @stackwright/types@1.6.0-alpha.2

## 0.1.2-alpha.1

### Patch Changes

- Updated dependencies [af4a166]
  - @stackwright/types@1.6.0-alpha.1

## 0.1.2-alpha.0

### Patch Changes

- Updated dependencies [be7f767]
  - @stackwright/types@1.5.1-alpha.0

## 0.1.1

## 0.1.1-alpha.3

### Patch Changes

- e6b3459: fix(scaffold-core): export HookHandler type from hooks-registry and scaffold-core

  `HookHandler` is the canonical type alias for scaffold hook handler functions,
  defined in `@stackwright/types`. It was re-exported by `hooks-registry/src/hooks.ts`
  but not forwarded through `index.ts`, making it unavailable via the public package
  import paths.

  Both `@stackwright/hooks-registry` and `@stackwright/scaffold-core` now re-export
  `HookHandler` alongside the other scaffold hook types. This completes Phase 1 step 4
  of the types-hierarchy-refactor.

## 0.1.1-alpha.2

### Patch Changes

- adb13ae: Remove `prepublishOnly` workspace: specifier guard that conflicted with `pnpm publish`'s automatic `workspace:*` → semver resolution. The guard checked the local `package.json` for `workspace:*` entries and rejected them, but `pnpm publish` rewrites those specifiers inside the tarball at publish time without modifying the local file — so the guard always produced false positives and blocked all publishes.
- Updated dependencies [adb13ae]
  - @stackwright/types@1.5.0-alpha.3

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
