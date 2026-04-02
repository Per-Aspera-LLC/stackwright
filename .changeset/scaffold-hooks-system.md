---
"@stackwright/scaffold-core": minor
"@stackwright/cli": minor
"@stackwright/launch-stackwright": minor
---

Add scaffold hooks system for extensible post-scaffold processing. Pro packages can now register hooks at lifecycle points (preScaffold, preInstall, postInstall, postScaffold) to inject dependencies, configure MCP servers, and add custom setup.
