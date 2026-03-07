---
"@stackwright/build-scripts": minor
---

Add `--watch` mode to `stackwright-prebuild` for hot recompilation of YAML content and co-located images during development. Changes to page content files, site config, and images are detected via `fs.watch` and trigger an automatic rebuild within ~150ms, enabling the live authoring loop where AI agents or humans can edit content and see changes in the browser without restarting the dev server.
