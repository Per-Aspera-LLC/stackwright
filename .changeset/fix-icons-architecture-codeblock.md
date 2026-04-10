---
"@stackwright/icons": patch
"@stackwright/core": patch
---

Fix missing Lucide icons (Code2, Layout) and improve CodeBlock rendering for ASCII art diagrams

### Icon Registry Fixes
- **Code2 icon**: Added direct import to lucideAllIcons.ts (was missing from barrel export)
- **Layout icon**: Added direct import to lucideAllIcons.ts (was missing from barrel export)

### CodeBlock Improvements  
- Better monospace font stack for proper ASCII art alignment
- Added font-variant-ligatures: none to prevent character transformation issues

### Architecture Page Fixes
- Replaced problematic YAML/JSON code blocks with tabbed_content component
- Fixed overflow issues caused by ASCII art alignment problems
