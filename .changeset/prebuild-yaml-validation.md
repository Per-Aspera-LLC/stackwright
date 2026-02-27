---
"@stackwright/build-scripts": minor
---

Add Zod schema validation to the prebuild pipeline. Both `stackwright.yml` and each page `content.yml` are now validated against their schemas after YAML parsing. Invalid content fails loudly with structured field-level error messages before image processing runs, closing the gap between "schema exists for IDE hints" and "schema is enforced before execution".
