---
"@stackwright/core": patch
"@stackwright/icons": patch
"@stackwright/maplibre": patch
"@stackwright/nextjs": patch
"@stackwright/ui-shadcn": patch
---

chore: consolidate dependabot dependency updates

- `lucide-react`: `^0.525.0` → `^1.8.0` (icons, ui-shadcn) — includes icon rename fixes for v1 API (`CheckCircle` → `CircleCheck`, `Code2`/`Layout` backward-compat aliases)
- `@swc/core`: `^1.15.18` → `^1.15.26` (core, nextjs)
- `jsdom`: `^28.1.0` → `^29.0.2` (maplibre)
- `react-dom`: `19.2.4` → `19.2.5` (pnpm.overrides)
- `prettier`: `^3.8.1` → `^3.8.3` (devDependencies)
