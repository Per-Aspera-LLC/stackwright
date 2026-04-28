---
"@stackwright/build-scripts": patch
---

fix(executePluginHook): preserve `this` binding when calling plugin lifecycle hooks

`executePluginHook` was extracting hook methods as unbound references
(`const hookFn = plugin[hook]`) and calling them as plain functions
(`hookFn(context)`). In strict-mode ES classes, this strips `this`,
causing any plugin that calls a private/instance method from `beforeBuild`
or `afterBuild` to throw `Cannot read properties of undefined`.

Fix: use `hookFn.call(plugin, context)` so the plugin instance is always
the receiver.
