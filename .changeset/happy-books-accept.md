---
"stackwright": patch
---

fix(ci): update GitHub Actions to latest versions

- actions/checkout@v5 (was v4)
- actions/setup-node@v5 (was v4)
- pnpm/action-setup@v4 (was v3)
- Node 22 (was 20 in deploy-docs and prerelease)
- Add deploy-docs.yml to its own path triggers

Updated composite action and all workflows to use latest action versions.
