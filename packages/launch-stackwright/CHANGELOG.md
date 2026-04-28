# launch-stackwright

## 0.2.1-alpha.0

### Patch Changes

- Updated dependencies [f0b74ef]
- Updated dependencies [90a22c6]
- Updated dependencies [a410f02]
  - @stackwright/cli@0.8.1-alpha.0

## 0.2.0

### Minor Changes

- 8f34fd6: Add new `launch-stackwright` package — an npx-compatible scaffolding tool for creating new Stackwright projects. Automatically sets up a fully configured Next.js + Stackwright project with the otter raft (AI agents) ready to build your site through conversation.

  Includes:
  - Project scaffolding with Next.js and Stackwright dependencies
  - Pre-configured otter agent templates (foreman, page, theme, and brand)
  - MCP server auto-configuration for Code Puppy
  - Full AI-assisted development workflow out of the box

  Usage: `npx launch-stackwright my-site`

- 8f34fd6: Add scaffold hooks system for extensible post-scaffold processing. Pro packages can now register hooks at lifecycle points (preScaffold, preInstall, postInstall, postScaffold) to inject dependencies, configure MCP servers, and add custom setup.

### Patch Changes

- 8f34fd6: feat(otters): install @stackwright/otters as npm package instead of copying files

  Following the "Otters as Packages" pattern established by @stackwright-pro/otters:
  - Created new @stackwright/otters package with all 4 otter JSON files
  - Updated CLI to add @stackwright/otters as dependency in generated package.json
  - Updated launch-stackwright to generate .code-puppy.json pointing to node_modules
  - Removed file copying logic from launch-stackwright

- Updated dependencies [8f34fd6]
- Updated dependencies [8f34fd6]
- Updated dependencies [46df0c5]
- Updated dependencies [46df0c5]
- Updated dependencies [8f34fd6]
- Updated dependencies [46df0c5]
- Updated dependencies [8f34fd6]
- Updated dependencies [8f34fd6]
- Updated dependencies [8f34fd6]
- Updated dependencies [8f34fd6]
- Updated dependencies [8f34fd6]
- Updated dependencies [8f34fd6]
- Updated dependencies [8f34fd6]
- Updated dependencies [8f34fd6]
- Updated dependencies [8f34fd6]
  - @stackwright/cli@0.8.0
  - @stackwright/otters@0.2.0
  - @stackwright/scaffold-core@0.3.0

## 0.2.0-alpha.10

### Patch Changes

- Updated dependencies [ab178cb]
  - @stackwright/otters@0.2.0-alpha.4

## 0.2.0-alpha.9

### Patch Changes

- Updated dependencies [1f30003]
  - @stackwright/otters@0.2.0-alpha.3

## 0.2.0-alpha.8

### Minor Changes

- b2e451a: Add scaffold hooks system for extensible post-scaffold processing. Pro packages can now register hooks at lifecycle points (preScaffold, preInstall, postInstall, postScaffold) to inject dependencies, configure MCP servers, and add custom setup.

### Patch Changes

- Updated dependencies [5c351f5]
- Updated dependencies [b2e451a]
  - @stackwright/cli@0.7.0-alpha.11
  - @stackwright/scaffold-core@0.1.0-alpha.1

## 0.2.0-alpha.7

### Patch Changes

- Updated dependencies [a852368]
- Updated dependencies [24fed0f]
  - @stackwright/otters@0.2.0-alpha.2
  - @stackwright/cli@0.7.0-alpha.10
- Added `--otter-raft` flag for one-command project setup with all dependencies installed
- Run `npx launch-stackwright my-site --otter-raft` to scaffold and install in one step
- Updated to use scaffold hooks system for MCP configuration
- Hooks run automatically when using --otter-raft flag

## 0.2.0-alpha.6

### Patch Changes

- 8bb4629: feat(otters): install @stackwright/otters as npm package instead of copying files

  Following the "Otters as Packages" pattern established by @stackwright-pro/otters:
  - Created new @stackwright/otters package with all 4 otter JSON files
  - Updated CLI to add @stackwright/otters as dependency in generated package.json
  - Updated launch-stackwright to generate .code-puppy.json pointing to node_modules
  - Removed file copying logic from launch-stackwright

- Updated dependencies [8bb4629]
  - @stackwright/otters@0.2.0-alpha.0
  - @stackwright/cli@0.7.0-alpha.9

## 0.2.0-alpha.5

### Patch Changes

- @stackwright/cli@0.7.0-alpha.8

## 0.2.0-alpha.4

### Patch Changes

- Updated dependencies [06e97c0]
- Updated dependencies [6cda0f0]
  - @stackwright/cli@0.7.0-alpha.7

## 0.2.0-alpha.3

### Patch Changes

- @stackwright/cli@0.7.0-alpha.6

## 0.2.0-alpha.2

### Patch Changes

- @stackwright/cli@0.7.0-alpha.5

## 0.2.0-alpha.1

### Patch Changes

- @stackwright/cli@0.7.0-alpha.4

## 0.2.0-alpha.0

### Minor Changes

- 8e60dbd: Add new `launch-stackwright` package — an npx-compatible scaffolding tool for creating new Stackwright projects. Automatically sets up a fully configured Next.js + Stackwright project with the otter raft (AI agents) ready to build your site through conversation.

  Includes:
  - Project scaffolding with Next.js and Stackwright dependencies
  - Pre-configured otter agent templates (foreman, page, theme, and brand)
  - MCP server auto-configuration for Code Puppy
  - Full AI-assisted development workflow out of the box

  Usage: `npx launch-stackwright my-site`

## 0.1.0 - 2025-03-26

### 🚢 Initial Launch!

The fastest way to get started with Stackwright — launch a new project with the otter raft ready to build.

#### Features

- **One-command project creation**: `npx launch-stackwright my-site`
- **Otter raft included**: All four specialized AI agents (Foreman, Brand, Theme, Page) automatically configured
- **MCP auto-configuration**: `.code-puppy.json` created with Stackwright MCP server settings
- **Full scaffolding**: Uses `@stackwright/cli` scaffold functionality under the hood
- **Flexible options**: Supports all scaffold options (--theme, --name, --title, etc.)
- **Skip otter setup**: Use `--skip-otters` if you just want the project scaffold

#### What Gets Created

```
my-site/
├── .code-puppy.json           # Code Puppy + MCP auto-config
├── .stackwright/
│   └── otters/                # The otter raft configs
│       ├── stackwright-foreman-otter.json
│       ├── stackwright-brand-otter.json
│       ├── stackwright-theme-otter.json
│       └── stackwright-page-otter.json
├── pages/
│   ├── content.yml            # Home page
│   ├── getting-started/
│   │   └── content.yml        # Getting started page
│   ├── [...slug].tsx          # Dynamic page router
│   └── _app.tsx               # Next.js app wrapper
├── stackwright.yml            # Theme configuration
├── next.config.js             # Next.js config
├── package.json               # Dependencies
└── tsconfig.json              # TypeScript config
```

#### Usage

```bash
# Interactive mode (default)
npx launch-stackwright my-site

# Specify everything upfront
npx launch-stackwright my-site --name "my-app" --title "My Site" --theme corporate

# Quick start with defaults
npx launch-stackwright my-site --yes

# Skip otter setup
npx launch-stackwright my-site --skip-otters
```

#### Next Steps After Launching

1. Install dependencies: `pnpm install`
2. Start dev server: `pnpm dev`
3. Invoke the otter raft: `code-puppy invoke stackwright-foreman-otter`
4. Say: "Build me a [law firm / wellness startup / SaaS marketing] website"

The raft will coordinate brand discovery, theme design, and page building — all from conversation!
