---
"@stackwright/core": patch
---

fix(core): `CodeBlock` now selects Shiki syntax theme based on surface luminance rather than `colorMode`, fixing dark-text-on-dark-background for themes with a dark surface in light mode (e.g. the stackwright-docs documentation theme)
