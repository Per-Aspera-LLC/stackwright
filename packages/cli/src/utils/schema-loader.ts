// Load JSON schemas from @stackwright/types using the package exports map.
// require.resolve honours the exports map so the actual filename on disk doesn't matter.

export function loadContentSchema(): Record<string, unknown> {
  return require(require.resolve('@stackwright/types/schemas/content-schema.json')) as Record<string, unknown>;
}

export function loadSiteConfigSchema(): Record<string, unknown> {
  return require(require.resolve('@stackwright/types/schemas/siteconfig-schema.json')) as Record<string, unknown>;
}

export function loadThemeSchema(): Record<string, unknown> {
  return require(require.resolve('@stackwright/types/schemas/theme-schema.json')) as Record<string, unknown>;
}
