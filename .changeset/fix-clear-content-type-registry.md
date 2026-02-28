---
"@stackwright/core": patch
---

fix(core): clearContentTypeRegistry now also deregisters components from componentRegistry, eliminating the need for manual `delete componentRegistry[key]` workarounds in tests
