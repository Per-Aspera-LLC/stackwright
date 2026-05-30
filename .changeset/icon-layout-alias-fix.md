---
"@stackwright/build-scripts": patch
---

Add `Layout → LayoutTemplate` to `LEGACY_MUI_ICON_ALIASES` in the icon manifest generator. `Layout` was renamed to `LayoutTemplate` in lucide-react v1.x; without this alias the prebuild emitted `import { Layout } from 'lucide-react'` which does not exist and crashes the build.
