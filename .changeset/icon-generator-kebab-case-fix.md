---
"@stackwright/build-scripts": patch
---

Fix icon generator to handle kebab-case and lowercase YAML icon names per
lucide.dev's URL-slug naming convention.

The icon manifest generator previously emitted YAML icon names verbatim into
the TypeScript import statement, which fails for kebab-case names (`alert-triangle`
parses as `alert minus triangle`) and produces undefined imports for lowercase
single-word names (`activity` is valid TS but lucide-react only exports
PascalCase `Activity`).

Generator now normalizes YAML names to lucide-react's PascalCase export
convention while preserving the kebab-case keys in the runtime registry
(`'alert-triangle': AlertTriangle`). Existing PascalCase YAML names and the
LEGACY_MUI_ICON_ALIASES map continue to work unchanged.

Empirical fixture: kennel drawer 815 (stackwright-pro repo, planning session
2026-06-25) — the bxps verification raft generated a full Storm Surge app
with YAML using `icon: alert-triangle` etc., which then failed `pnpm dev` on
TypeScript parse error in the generated `stackwright-generated/icons.ts`.
