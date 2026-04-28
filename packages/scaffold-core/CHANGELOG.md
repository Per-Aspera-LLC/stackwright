# Changelog

## 0.3.0

### Minor Changes

- 8f34fd6: Add scaffold hooks system for extensible post-scaffold processing. Pro packages can now register hooks at lifecycle points (preScaffold, preInstall, postInstall, postScaffold) to inject dependencies, configure MCP servers, and add custom setup.

## 0.1.0

### Minor Changes

- 53623f6: Add scaffold hooks system for extensible post-scaffold processing. Pro packages can now register hooks at lifecycle points (preScaffold, preInstall, postInstall, postScaffold) to inject dependencies, configure MCP servers, and add custom setup.

## 0.1.0-alpha.1

### Minor Changes

- b2e451a: Add scaffold hooks system for extensible post-scaffold processing. Pro packages can now register hooks at lifecycle points (preScaffold, preInstall, postInstall, postScaffold) to inject dependencies, configure MCP servers, and add custom setup.

## 0.1.0-alpha.0

- Initial release
- Hook types: `preScaffold`, `preInstall`, `postInstall`, `postScaffold`
- Registry functions: `registerScaffoldHook`, `getScaffoldHooks`, `clearScaffoldHooks`
- Context with mutable `packageJson` and `codePuppyConfig`
- Priority and critical hook options
