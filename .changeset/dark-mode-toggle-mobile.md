---
"@stackwright/core": patch
---

fix(top-app-bar): always show color mode toggle on mobile

The `colorModeToggle` was previously hidden on narrow screens when nav
menu items were present. It is now always visible — rendering to the
left of the hamburger icon on mobile (`[🌙] [☰]`) and to the right of
nav links on desktop. Replaces one compound conditional with three
intent-revealing render sites.
