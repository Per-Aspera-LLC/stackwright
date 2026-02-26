---
"@stackwright/cli": minor
---

Modernize scaffold template to match current project conventions.

New projects created with `stackwright scaffold` now:
- Include a `getting-started/` starter page alongside the root page, demonstrating the subdirectory-per-slug convention
- Scaffold `stackwright.yml` with a full `customTheme` block (colors, typography, spacing) instead of a bare `themeName` reference
- Include a CTA button on the root page linking to the getting-started page
- Use the secure `[slug].tsx` template with slug allowlist validation (path traversal prevention)
- Include `pnpm` engine spec (`>=10.0.0`) and `packageManager` field in `package.json`
- Have an enriched `.env.local.example` with copy instructions and clearer comments
- Have a WSL-annotated `.gitignore`
