---
"@stackwright/types": patch
---

Add Zod `.refine()` validation for image dimensions. BREAKING: Images must have both height+width OR height+aspect_ratio. Fix content.yml with explicit dimensions.
