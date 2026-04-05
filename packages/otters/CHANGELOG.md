# @stackwright/otters

## 0.2.0

### Minor Changes

- 8bb4629: feat(otters): install @stackwright/otters as npm package instead of copying files

  Following the "Otters as Packages" pattern established by @stackwright-pro/otters:
  - Created new @stackwright/otters package with all 4 otter JSON files
  - Updated CLI to add @stackwright/otters as dependency in generated package.json
  - Updated launch-stackwright to generate .code-puppy.json pointing to node_modules
  - Removed file copying logic from launch-stackwright

- c1ca6ed: Add postinstall script to install otters to ~/.code_puppy/agents/
  - Created scripts/install-agents.js that copies agent JSON files to ~/.code_puppy/agents/
  - Updated package.json with postinstall hook
  - Updated README with installation instructions
  - Fixed .code-puppy.json config (removed agents_path)
  - Bumped version to 0.2.0-alpha.1

### Patch Changes

- 1f30003: fix(otters): unpin AI model versions to allow automatic model updates
- 6a51af8: Relocate otters to packages/otters/src/ directory for proper monorepo structure

## 0.2.0-alpha.4

### Patch Changes

- 6a51af8: Relocate otters to packages/otters/src/ directory for proper monorepo structure

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
