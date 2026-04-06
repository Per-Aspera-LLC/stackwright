---
"@stackwright/types": minor
---

feat: add integrations config to site schema

Adds `integrations` field to site config schema for Pro package integrations (OpenAPI, GraphQL, REST). Each integration requires `type` and `name` fields, with additional plugin-specific config allowed via passthrough.

Closes #240
