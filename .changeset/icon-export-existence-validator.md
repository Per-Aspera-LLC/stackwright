---
"@stackwright/build-scripts": minor
---

Add lucide-react export existence validator to `generateIconManifest()`.

Previously, YAML content could reference icon names that don't exist in
`lucide-react` (e.g. `icon: bridge`). The generated `icons.ts` would emit
a broken import that caused Turbopack to 500 every route at dev-server start.

This change ships:

- `LUCIDE_REACT_EXPORTS` — a compile-time Set of all importable lucide-react
  names (canonical exports + deprecated aliases), generated from
  `lucide-react/dist/lucide-react.d.ts` and committed as
  `src/compile/lucide-exports.json`.

- `isValidLucideExport(name)` — pure exported utility; returns `true` if
  `name` is a real lucide-react export.

- `mapToValidLucideName(yamlSrc)` — exported utility; applies
  `LEGACY_MUI_ICON_ALIASES` + `lucideExportName()` then validates. On miss,
  emits a `console.warn` and returns `HelpCircle` (the fallback).

- `generateIconManifest()` now validates every resolved icon name against the
  allow-list. Unknown icons fall back to `HelpCircle` with a per-icon warning
  and a summary count at the end. The original YAML key is preserved in the
  `siteIconPreset` object so runtime lookup continues to work. Hard failures
  are never emitted — a broken icon name should not take down the dev server.
