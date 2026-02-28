---
"@stackwright/cli": patch
---

refactor(cli): replace dynamic require() with static imports for sub-type schema introspection

Sub-type schemas are now imported statically from @stackwright/types, making the
dependency explicit and eliminating the silent-drop risk when a schema is renamed.
