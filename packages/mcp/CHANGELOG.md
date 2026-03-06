# @stackwright/mcp

## 0.2.0-alpha.5

### Minor Changes

- 0f05ba1: Add `stackwright_stage_changes` and `stackwright_open_pr` MCP tools completing the AI editorial loop. Agents can now go from content authoring to PR creation entirely via MCP — staging only content files for safety and validating all YAML before committing. Requires the GitHub CLI (`gh`) for PR creation.

### Patch Changes

- Updated dependencies [0f05ba1]
  - @stackwright/cli@0.6.0-alpha.5

## 0.2.0-alpha.4

### Minor Changes

- f330ab8: Add MCP tools for reading and writing page content and site configuration. New tools: `stackwright_get_page` (read page YAML by slug), `stackwright_write_page` (write/update page YAML with validation), and `stackwright_get_site_config` (read site config YAML). Also adds corresponding CLI commands `page get`, `page write`, and `site get`.

### Patch Changes

- Updated dependencies [f330ab8]
  - @stackwright/cli@0.6.0-alpha.4

## 0.1.2-alpha.3

### Patch Changes

- Updated dependencies [62a97d5]
  - @stackwright/types@0.4.0-alpha.2
  - @stackwright/cli@0.6.0-alpha.3

## 0.1.2-alpha.2

### Patch Changes

- Updated dependencies [a6c3fcf]
  - @stackwright/types@0.4.0-alpha.1
  - @stackwright/cli@0.6.0-alpha.2

## 0.1.2-alpha.1

### Patch Changes

- Updated dependencies [6820928]
  - @stackwright/types@0.3.2-alpha.0
  - @stackwright/cli@0.6.0-alpha.1

## 0.1.2-alpha.0

### Patch Changes

- Updated dependencies [4efd19a]
  - @stackwright/cli@0.6.0-alpha.0

## 0.1.1

### Patch Changes

- @stackwright/cli@0.5.1
- @stackwright/types@0.3.1

## 0.1.0

### Minor Changes

- 855fc18: Add `@stackwright/mcp` — a stdio-based MCP server (`pnpm stackwright-mcp`) that exposes Stackwright as 8 agent tools: `stackwright_get_content_types`, `stackwright_list_pages`, `stackwright_add_page`, `stackwright_validate_pages`, `stackwright_validate_site`, `stackwright_list_themes`, `stackwright_get_project_info`, and `stackwright_scaffold_project`. All tools use Zod for input validation and return structured MCP responses with error flags.

### Patch Changes

- b728f0d: Added MCP Server package
- Updated dependencies [750f84a]
- Updated dependencies [ce372ed]
- Updated dependencies [4a15246]
- Updated dependencies [1c35939]
  - @stackwright/types@0.3.0
  - @stackwright/cli@0.5.0

## 0.1.0-alpha.2

### Patch Changes

- Updated dependencies [ce372ed]
- Updated dependencies [4a15246]
  - @stackwright/types@0.3.0-alpha.2
  - @stackwright/cli@0.5.0-alpha.2

## 0.1.0-alpha.1

### Minor Changes

- 855fc18: Add `@stackwright/mcp` — a stdio-based MCP server (`pnpm stackwright-mcp`) that exposes Stackwright as 8 agent tools: `stackwright_get_content_types`, `stackwright_list_pages`, `stackwright_add_page`, `stackwright_validate_pages`, `stackwright_validate_site`, `stackwright_list_themes`, `stackwright_get_project_info`, and `stackwright_scaffold_project`. All tools use Zod for input validation and return structured MCP responses with error flags.

### Patch Changes

- b728f0d: Added MCP Server package
