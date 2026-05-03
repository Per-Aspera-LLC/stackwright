---
"@stackwright/build-scripts": minor
"@stackwright/types": minor
---

Add plugin-type warnings and `unknownContentTypes` option to prebuild

**Gap 1 — plugin-declared types now emit a warning**: When a page uses a content type allowed via a plugin's `knownContentTypeKeys`, the prebuild now logs a warning reminding you to call `registerContentType()` at runtime.

**Gap 2 — `unknownContentTypes` option**: `PrebuildOptions` gains `unknownContentTypes?: 'error' | 'warn' | 'ignore'` (default `'error'`). Allows demo projects or WIP builds to downgrade content validation failures from hard errors to warnings or silence.
