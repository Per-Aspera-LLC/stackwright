---
"@stackwright/core": minor
---

feat: add resolveBackground utility for dark-mode-aware section backgrounds

All content components now resolve background values through resolveBackground().
Theme color keys (e.g., 'surface', 'primary') are mapped to the current theme.colors,
which is dark-mode-aware. Literal hex values pass through unchanged (backward compatible).
