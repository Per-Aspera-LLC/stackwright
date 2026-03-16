---
"@stackwright/types": patch
"@stackwright/cli": patch
---

Move JSON schema output from `dist/schemas/` to `schemas/` (committed to git) so CI can detect drift. Update package exports and `files` field. Update scaffold `.vscode/settings.json` to reference the new schema path.
