// PLACEHOLDER — overwritten by stackwright-prebuild on first `pnpm predev` run.
// Until then, uses the curated icon preset (~43 icons) as a safe fallback.
//
// To generate the site-optimized version: pnpm predev
// This file is safe to commit.
import { registerDefaultIcons } from '@stackwright/icons';

export function registerSiteIcons(): void {
  // Delegates to the curated preset until prebuild generates the optimized manifest.
  registerDefaultIcons();
}
