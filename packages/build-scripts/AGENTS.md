# @stackwright/build-scripts — Agent Guide

Prebuild pipeline for Stackwright projects. Runs before `next build` and `next dev` to compile YAML content and process co-located images.

---

## What This Package Does

The `stackwright-prebuild` CLI binary performs these steps:

1. **Scans** `content/pages/` (or equivalent) for YAML page definitions
2. **Parses** each YAML file with `js-yaml`
3. **Processes images**: Files referenced with `./relative` paths are copied to `public/images/` preserving directory structure; paths are rewritten to `/images/...` in the output
4. **Compiles** page content into JSON files at `public/stackwright-content/<slug>.json`
5. **Compiles** site config into `public/stackwright-content/_site.json`
6. **Scans** `content/` for collections — each subdirectory becomes a collection
7. **Builds** collection manifests (`_index.json`) and individual entry JSON files into `public/stackwright-content/collections/<name>/`

At runtime, `getStaticProps` reads from these JSON files — no filesystem work at render time.

---

## How It's Triggered

Via npm lifecycle hooks in the consumer's `package.json`:

```json
"prebuild": "stackwright-prebuild",
"predev": "stackwright-prebuild"
```

Without these hooks, co-located images won't be found and content won't be compiled.

---

## Watch Mode

`src/watch.ts` provides a file watcher for development. It watches `content/pages/` and `content/` directories with debouncing and SSE notification to trigger browser refreshes on content changes.

---

## Package Structure

```
src/
  prebuild.ts   — Main prebuild pipeline (entry point for the bin)
  watch.ts      — File watcher for dev mode
  index.ts      — Public exports
```

## Dependencies

- **@stackwright/types** — Zod schemas for validation
- **js-yaml** — YAML parsing
