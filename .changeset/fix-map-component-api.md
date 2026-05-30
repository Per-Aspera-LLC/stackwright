---
"@stackwright/types": patch
"@stackwright/core": patch
---

Fix Map content type: assemble MapConfig from flat YAML props (was crashing on render), move Map component to base directory, tighten mapLayerSchema.data to z.unknown(), remove duplicate ZodLike declaration, fix checkForPlaintextSecret entropy threshold direction
