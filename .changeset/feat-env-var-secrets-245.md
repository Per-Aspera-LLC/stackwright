---
"@stackwright/types": minor
"@stackwright/build-scripts": minor
---

Add environment variable resolution for integration secrets

This PR introduces support for referencing secrets from environment variables in integration configurations. Key changes include:

- New `SecretReference` type for env var secret resolution
- `SecretDetection` utilities for runtime secret validation
- Updated site config schema with integration secret support
- Prebuild script updates for env var substitution
