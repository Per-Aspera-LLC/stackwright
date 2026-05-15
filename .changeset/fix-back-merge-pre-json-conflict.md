---
"@stackwright/cli": patch
---

Fix back-merge into dev failing with a modify/delete conflict on `.changeset/pre.json` during rebase. The release workflow deletes this file via `changeset pre exit`, but dev's alpha-bump commits still reference it. The rebase now explicitly resolves the conflict by accepting main's deletion and continuing.
