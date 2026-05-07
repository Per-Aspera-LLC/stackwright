---
"@stackwright/cli": patch
---

Bundle internal `@stackwright/*` workspace dependencies into the CLI binary via tsup `noExternal`. This fixes `ERR_PNPM_WORKSPACE_PKG_NOT_FOUND` when installing `@stackwright/cli` via `pnpm dlx` outside a monorepo. Also adds a `prepublishOnly` guard to catch any future `workspace:*` leakage before publish.
