# Changelog

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
