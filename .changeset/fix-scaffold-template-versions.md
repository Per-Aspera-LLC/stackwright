---
"@stackwright/cli": patch
---

fix(cli): update stale scaffold template package versions

`buildPackageJson()` in `template-processor.ts` was pinning scaffolded
projects to package versions that were 4+ releases behind:

- `@stackwright/core`: `^0.7.0` → `^0.8.0`
- `@stackwright/nextjs`: `^0.3.1` → `^0.5.0`
- `@stackwright/icons`: `^0.3.0` → `^0.5.0`
- `@stackwright/build-scripts`: `^0.4.0` → `^0.7.0` ← **critical**
- `@stackwright/ui-shadcn`: `^0.1.0` → `^0.1.2`
- `@stackwright/otters`: `^0.2.0-alpha.0` → `^0.2.0`

The `build-scripts` version was the critical failure: the plugin API
(`PrebuildPlugin`, `beforeBuild`, `contentItemSchemas`) was introduced in
0.5.0, but scaffolded projects installed 0.4.0 — a version that has no
plugin system at all. This caused Pro plugin hooks to silently fail or
crash in freshly scaffolded projects.

Also adds `scripts/sync-versions.mjs` — a Node ESM utility that reads
workspace `package.json` versions and rewrites the VERSIONS constant
automatically. Run `node scripts/sync-versions.mjs` before cutting releases
to prevent version drift.
