---
"@stackwright/cli": patch
---

Fix js-yaml version override conflict in pnpm overrides that caused `yaml.safeLoad is removed` errors when running `changeset pre exit` in CI. The global `js-yaml: >=4.1.1` override was stomping the scoped `read-yaml-file>js-yaml: ^3` override, forcing js-yaml v4 into read-yaml-file which doesn't support it.
