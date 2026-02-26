---
"@stackwright/core": patch
"@stackwright/build-scripts": patch
---

fix(sprint2): reliability and silent failure modes

- Add React error boundary to `DynamicPage` so a single bad component
  shows degraded UI instead of crashing the whole page
- Move `ShimmerOverlay` styled component to module scope in `DynamicPage`
  to prevent a new CSS class being generated on every render
- Fix image filename collisions in prebuild: include the slug in the
  destination path so pages with identically-named images no longer
  silently overwrite each other in `public/images/`
