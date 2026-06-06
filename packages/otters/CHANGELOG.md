# @stackwright/otters

## 0.2.2

### Patch Changes

- cd5403d: Expand Otter Raft documentation with detailed end-to-end pipeline checklist and reference example outputs for law firm, SaaS, and restaurant site types.

## 0.2.2-alpha.0

### Patch Changes

- 091ae66: Expand Otter Raft documentation with detailed end-to-end pipeline checklist and reference example outputs for law firm, SaaS, and restaurant site types.

## 0.2.1

### Patch Changes

- f1637a6: Remove `prepublishOnly` workspace: specifier guard that conflicted with `pnpm publish`'s automatic `workspace:*` → semver resolution. The guard checked the local `package.json` for `workspace:*` entries and rejected them, but `pnpm publish` rewrites those specifiers inside the tarball at publish time without modifying the local file — so the guard always produced false positives and blocked all publishes.
- d4a06ff: Add `prepublishOnly` workspace protocol guard to all publishable packages to prevent accidentally publishing with unresolved `workspace:*` specifiers.

  Also removes a stale `@stackwright/collections` dependency from `@stackwright/core` (never imported, caused `ERR_PNPM_WORKSPACE_PKG_NOT_FOUND` when installing the published package), and fixes `@stackwright/maplibre` peer dependency on `@stackwright/core` from `workspace:*` to `>=0.8.0`.

## 0.2.1-alpha.1

### Patch Changes

- adb13ae: Remove `prepublishOnly` workspace: specifier guard that conflicted with `pnpm publish`'s automatic `workspace:*` → semver resolution. The guard checked the local `package.json` for `workspace:*` entries and rejected them, but `pnpm publish` rewrites those specifiers inside the tarball at publish time without modifying the local file — so the guard always produced false positives and blocked all publishes.

## 0.2.1-alpha.0

### Patch Changes

- c18b6a1: Add `prepublishOnly` workspace protocol guard to all publishable packages to prevent accidentally publishing with unresolved `workspace:*` specifiers.

  Also removes a stale `@stackwright/collections` dependency from `@stackwright/core` (never imported, caused `ERR_PNPM_WORKSPACE_PKG_NOT_FOUND` when installing the published package), and fixes `@stackwright/maplibre` peer dependency on `@stackwright/core` from `workspace:*` to `>=0.8.0`.

## 0.2.0

### Minor Changes

- 8f34fd6: feat(otters): install @stackwright/otters as npm package instead of copying files

  Following the "Otters as Packages" pattern established by @stackwright-pro/otters:
  - Created new @stackwright/otters package with all 4 otter JSON files
  - Updated CLI to add @stackwright/otters as dependency in generated package.json
  - Updated launch-stackwright to generate .code-puppy.json pointing to node_modules
  - Removed file copying logic from launch-stackwright

- 8f34fd6: Add postinstall script to install otters to ~/.code_puppy/agents/
  - Created scripts/install-agents.js that copies agent JSON files to ~/.code_puppy/agents/
  - Updated package.json with postinstall hook
  - Updated README with installation instructions
  - Fixed .code-puppy.json config (removed agents_path)
  - Bumped version to 0.2.0-alpha.1

### Patch Changes

- 8f34fd6: fix(otters): unpin AI model versions to allow automatic model updates
- 8f34fd6: Relocate otters to packages/otters/src/ directory for proper monorepo structure

## 0.2.0-alpha.4

### Patch Changes

- ab178cb: Relocate otters to packages/otters/src/ directory for proper monorepo structure

## 0.2.0-alpha.3

### Patch Changes

- 1f30003: fix(otters): unpin AI model versions to allow automatic model updates

## 0.2.0-alpha.2

### Minor Changes

- a852368: Add postinstall script to install otters to ~/.code_puppy/agents/
  - Created scripts/install-agents.js that copies agent JSON files to ~/.code_puppy/agents/
  - Updated package.json with postinstall hook
  - Updated README with installation instructions
  - Fixed .code-puppy.json config (removed agents_path)
  - Bumped version to 0.2.0-alpha.1

## 0.2.0-alpha.0

### Minor Changes

- 8bb4629: feat(otters): install @stackwright/otters as npm package instead of copying files

  Following the "Otters as Packages" pattern established by @stackwright-pro/otters:
  - Created new @stackwright/otters package with all 4 otter JSON files
  - Updated CLI to add @stackwright/otters as dependency in generated package.json
  - Updated launch-stackwright to generate .code-puppy.json pointing to node_modules
  - Removed file copying logic from launch-stackwright
