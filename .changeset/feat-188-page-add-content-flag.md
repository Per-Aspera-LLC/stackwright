---
"@stackwright/cli": patch
---

feat(cli): add --content flag to `page add` for inline YAML (#188)

Agents can now create a page with full content in a single command instead of a two-step add + write sequence. Content is validated before writing; invalid YAML is rejected with field-level errors.
