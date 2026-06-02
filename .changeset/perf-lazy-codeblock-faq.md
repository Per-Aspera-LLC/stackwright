---
"@stackwright/core": patch
---

CodeBlock+PrismJS and FAQ+@radix-ui/react-accordion are now lazy-loaded via React.lazy() (~17-20KB gzip first-load savings). fuse.js moved to optionalDependencies — no behavior change for consumers.
