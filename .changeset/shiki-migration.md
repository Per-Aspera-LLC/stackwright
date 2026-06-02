---
"@stackwright/core": minor
---

Replace Prism.js with Shiki for syntax highlighting in CodeBlock

- **Shiki integration**: Uses Shiki with the JavaScript regex engine (no WASM binary required) for syntax highlighting, replacing the previous Prism.js-based highlighter
- **200+ languages**: Shiki supports 200+ languages out of the box (up from 10 with Prism). The same 10 languages are pre-loaded at startup for fast first-render
- **Theme-aware dark mode**: Uses GitHub Light and GitHub Dark themes that automatically switch based on the Stackwright color mode
- **Async initialization**: Highlighter loads asynchronously on first use; CodeBlock gracefully falls back to plain text until ready
- **Zero WASM**: Uses `createJavaScriptRegexEngine` — no WebAssembly binary to load or bundle
- **Bundle improvement**: Shiki is an external dependency (not bundled into the CodeBlock chunk), and grammars are lazy-loaded
- **Backward compatible**: `HighlightToken` interface unchanged; `getTokenColor` and `highlightCodeWithMode` preserved as deprecated shims
