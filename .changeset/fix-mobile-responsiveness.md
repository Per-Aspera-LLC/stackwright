---
"@stackwright/core": patch
---

Fix mobile responsiveness for FeatureList, TestimonialGrid, MainContentGrid, TopAppBar, ContactFormStub, and CompressedMenu. Grid components now use `auto-fill minmax()` for natural responsive columns. MainContentGrid uses `flex-wrap` with `calc()`-adjusted flex-basis to maintain text/image split at desktop and stack vertically on narrow screens. TopAppBar shows a hamburger menu on mobile (`isSmDown`) via `useBreakpoints()`. CompressedMenu generalized to accept generic item types. Also fixes `useBreakpoints` hook to gracefully handle missing `window.matchMedia` in JSDOM/SSR environments.
