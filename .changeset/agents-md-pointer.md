---
'@stackwright/cli': minor
---

`generate-agent-docs` now emits a short pointer to the generated `stackwright-page-authoring` skill between the AGENTS.md content-type markers instead of the full reference tables (execution-plan Phase 2.3). The pointer keeps a schema-derived list of valid `type` keys so the CI drift check remains live. The interface-contracts table is unchanged (its content is not covered by any skill).
