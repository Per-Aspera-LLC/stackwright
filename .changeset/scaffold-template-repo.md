---
"@stackwright/cli": minor
"@stackwright/mcp": patch
---

feat(cli): replace scaffold builder functions with Zod schema introspection + GitHub template repo

- New `schema-defaults.ts` generates valid default objects by walking Zod v4 schema `.def` structures, with a flat dot-path hints system for semantic overrides
- New `scaffold-hints.ts` provides hint maps for site config, root page, and getting-started page content
- New `template-fetcher.ts` fetches project boilerplate from the `stackwright-template-nextjs` GitHub template repo, with bundled fallback for offline/failure
- Add `--offline` flag to `scaffold` command to skip GitHub template fetch
- Fix #127: add `registerShadcnComponents()` to scaffold template `_app.tsx`
- CI: `check-template-sync` job detects drift between bundled templates and template repo
- CI: `sync-template-repo` workflow auto-pushes template changes on merge to dev
