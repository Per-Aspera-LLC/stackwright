---
"@stackwright/cli": patch
---

fix(cli): remove duplicate preInstall hook call from processTemplate

`processTemplate()` was calling `runScaffoldHooks('preInstall', ...)` internally,
then `scaffold.ts` called it again after `processTemplate` returned — running every
preInstall handler twice. Worse, the second call passed the original empty `{}` object
(not the built package.json), so hooks registered via `scaffold.ts` could never affect
the written file.

Fix: lifecycle orchestration now lives entirely in `scaffold.ts`. `buildPackageJson` is
exported so `scaffold.ts` can build the default package.json before running preInstall
hooks, then passes the already-hooks-modified object into `processTemplate` for writing.
`processTemplate` no longer calls hooks.

Fixes #351.
