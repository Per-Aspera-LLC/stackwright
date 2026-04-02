---
"@stackwright/sbom-generator": minor
---

feat: Add pluggable hook system for SBOM extensibility

Pro packages can now register hooks to extend SBOM generation:
- `preGenerate` / `postAnalyze` / `preFormat` / `postFormat` / `preWrite` / `postWrite`

Hook types:
- `priority`: Controls execution order (lower = first)
- `critical`: If true, failure fails entire SBOM generation

Auto-registration pattern (consistent with registerNextJSComponents, etc.):
```typescript
import '@stackwright-pro/sbom-enterprise'; // auto-registers hooks
```
