---
"@stackwright/cli": patch
---

fix: scaffold uses bundled templates by default and includes _document.tsx for dark mode support

- Flip template fetch to bundled-by-default (eliminates network dependency and 10-second timeout risk)
- Add `--online` flag (replaces `--offline`) for explicit GitHub template fetch
- Add `_document.tsx` to scaffold template for ColorModeScript / dark mode persistence
- Make `check-template-sync` CI job non-blocking (informational warning instead of hard failure)
