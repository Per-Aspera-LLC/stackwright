---
"@stackwright/types": minor
"@stackwright/core": minor
"@stackwright/build-scripts": minor
---

Add video media type support to the Stackwright framework.

- New `video` discriminator in the `MediaItem` union (`@stackwright/types`)
- `VideoContent` type with `src`, `autoplay`, `loop`, `muted`, `controls`, and `poster` fields
- `Media` component renders `<video>` elements for video media items (`@stackwright/core`)
- Prebuild pipeline recognizes and copies video files alongside images (`@stackwright/build-scripts`)
