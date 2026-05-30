# Changelog

## 0.3.2-alpha.2

### Patch Changes

- @stackwright/hooks-registry@0.1.2-alpha.2

## 0.3.2-alpha.1

### Patch Changes

- @stackwright/hooks-registry@0.1.2-alpha.1

## 0.3.2-alpha.0

### Patch Changes

- @stackwright/hooks-registry@0.1.2-alpha.0

## 0.3.1

### Patch Changes

- @stackwright/hooks-registry@0.1.1

## 0.3.1-alpha.3

### Patch Changes

- e6b3459: fix(scaffold-core): export HookHandler type from hooks-registry and scaffold-core

  `HookHandler` is the canonical type alias for scaffold hook handler functions,
  defined in `@stackwright/types`. It was re-exported by `hooks-registry/src/hooks.ts`
  but not forwarded through `index.ts`, making it unavailable via the public package
  import paths.

  Both `@stackwright/hooks-registry` and `@stackwright/scaffold-core` now re-export
  `HookHandler` alongside the other scaffold hook types. This completes Phase 1 step 4
  of the types-hierarchy-refactor.

- Updated dependencies [e6b3459]
  - @stackwright/hooks-registry@0.1.1-alpha.3

## 0.3.1-alpha.2

### Patch Changes

- adb13ae: Remove `prepublishOnly` workspace: specifier guard that conflicted with `pnpm publish`'s automatic `workspace:*` → semver resolution. The guard checked the local `package.json` for `workspace:*` entries and rejected them, but `pnpm publish` rewrites those specifiers inside the tarball at publish time without modifying the local file — so the guard always produced false positives and blocked all publishes.
- Updated dependencies [adb13ae]
  - @stackwright/hooks-registry@0.1.1-alpha.2

## 0.3.1-alpha.1

### Patch Changes

- Updated dependencies [b9a482b]
  - @stackwright/hooks-registry@0.1.1-alpha.1

## 0.3.1-alpha.0

### Patch Changes

- c18b6a1: Add `prepublishOnly` workspace protocol guard to all publishable packages to prevent accidentally publishing with unresolved `workspace:*` specifiers.

  Also removes a stale `@stackwright/collections` dependency from `@stackwright/core` (never imported, caused `ERR_PNPM_WORKSPACE_PKG_NOT_FOUND` when installing the published package), and fixes `@stackwright/maplibre` peer dependency on `@stackwright/core` from `workspace:*` to `>=0.8.0`.

- Updated dependencies [c18b6a1]
  - @stackwright/hooks-registry@0.1.1-alpha.0

## 0.3.0

### Minor Changes

- 8f34fd6: Add scaffold hooks system for extensible post-scaffold processing. Pro packages can now register hooks at lifecycle points (preScaffold, preInstall, postInstall, postScaffold) to inject dependencies, configure MCP servers, and add custom setup.

## 0.1.0

### Minor Changes

- 53623f6: Add scaffold hooks system for extensible post-scaffold processing. Pro packages can now register hooks at lifecycle points (preScaffold, preInstall, postInstall, postScaffold) to inject dependencies, configure MCP servers, and add custom setup.

## 0.1.0-alpha.1

### Minor Changes

- b2e451a: Add scaffold hooks system for extensible post-scaffold processing. Pro packages can now register hooks at lifecycle points (preScaffold, preInstall, postInstall, postScaffold) to inject dependencies, configure MCP servers, and add custom setup.

## 0.1.0-alpha.0

- Initial release
- Hook types: `preScaffold`, `preInstall`, `postInstall`, `postScaffold`
- Registry functions: `registerScaffoldHook`, `getScaffoldHooks`, `clearScaffoldHooks`
- Context with mutable `packageJson` and `codePuppyConfig`
- Priority and critical hook options
