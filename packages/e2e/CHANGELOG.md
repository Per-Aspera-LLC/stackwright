# @stackwright/e2e

## 0.1.0-alpha.0

### Minor Changes

- 163e3b1: Add visual regression tests for all 13 content types and MCP component preview tool

  - Screenshot-based visual regression tests (desktop 1280px + mobile 375px) for every content type on the showcase page
  - `data-content-type` and `data-label` attributes on content item wrappers for reliable DOM targeting
  - New `stackwright_preview_component` MCP tool returns PNG screenshots of content types to AI agents
  - Sync script to copy E2E baselines to MCP package for serving via the preview tool
