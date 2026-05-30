---
"@stackwright/cli": patch
"@stackwright/nextjs": patch
---

fix(scaffold): add @stackwright/collections and lucide-react to generated package.json

Scaffolded projects failed `next build` with module-not-found errors for
`@stackwright/collections` (imported by `providers.tsx`) and `lucide-react`
(imported by the prebuild-generated `stackwright-generated/icons.ts`). Both
packages are now included as dependencies in the scaffold-generated
`package.json`. Also adds `@stackwright/collections` to `sync-versions.mjs`
so future release syncs keep it in lockstep. Fixes bead stackwright-1ec.
