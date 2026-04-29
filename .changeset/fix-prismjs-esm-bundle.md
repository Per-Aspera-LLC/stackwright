---
"@stackwright/core": patch
---

fix(core): bundle prismjs to eliminate bare ESM sub-path imports

`@stackwright/core`'s published ESM bundle contained bare imports such as
`import 'prismjs/components/prism-javascript'` (no `.js` extension). Because
`prismjs` is a legacy CJS package with no `exports` map, Node.js ESM strict
resolver could not find these paths and threw `ERR_MODULE_NOT_FOUND`.

Added `noExternal: ['prismjs']` to `tsup.config.ts` so that esbuild bundles
prismjs inline at build time. All language grammar paths are resolved to real
`.js` files before the bundle is published — no bare specifiers escape into
the output.
