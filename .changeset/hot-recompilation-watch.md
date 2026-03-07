---
"@stackwright/build-scripts": minor
"@stackwright/core": patch
---

Add `--watch` mode to `stackwright-prebuild` for hot recompilation of YAML content and co-located images during development. Changes to page content files, site config, and images are detected via `fs.watch` and trigger an automatic rebuild within ~150ms. A built-in SSE server notifies the browser to auto-reload when content changes, enabling the live authoring loop where AI agents or humans can edit content and see changes appear without restarting the dev server or manually refreshing.
