---
"@stackwright/cli": patch
---

Upgrade the back-merge rebase conflict handler from a one-shot block to a loop. Dev can accumulate multiple alpha-bump commits that all modified `.changeset/pre.json` — the previous one-shot `||{ }` only resolved the first conflict. The loop now runs until all pre.json conflicts are resolved or an unexpected conflict is encountered.
