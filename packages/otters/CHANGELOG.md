# @stackwright/otters

## 0.2.0-alpha.0

### Minor Changes

- 8bb4629: feat(otters): install @stackwright/otters as npm package instead of copying files

  Following the "Otters as Packages" pattern established by @stackwright-pro/otters:
  - Created new @stackwright/otters package with all 4 otter JSON files
  - Updated CLI to add @stackwright/otters as dependency in generated package.json
  - Updated launch-stackwright to generate .code-puppy.json pointing to node_modules
  - Removed file copying logic from launch-stackwright
