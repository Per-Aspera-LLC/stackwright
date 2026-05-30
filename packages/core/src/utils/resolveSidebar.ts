import { PageSidebar, SiteConfig } from '@stackwright/types';

/**
 * Resolves the effective sidebar config for a page.
 *
 * Resolution order (highest wins):
 *  1. Page-level `navSidebar` in content.yml (explicit override)
 *  2. Site-level `sidebar` in stackwright.yml (default)
 *  3. undefined (no sidebar)
 *
 * Special case: `navSidebar: null` in page content always hides the sidebar,
 * even when the site config has a sidebar. This lets dashboard / full-bleed
 * pages opt out without removing the sidebar from the theme.
 */
export function resolveSidebarConfig(
  pageSidebar: PageSidebar | null | undefined,
  siteSidebar: SiteConfig['sidebar']
): SiteConfig['sidebar'] | undefined {
  // null means "hide sidebar on this page" — explicit override wins
  if (pageSidebar === null) {
    return undefined;
  }

  // undefined means "use site config" (no override)
  if (pageSidebar === undefined) {
    return siteSidebar;
  }

  // Partial override — merge page values over site defaults
  if (siteSidebar) {
    return {
      navigation: pageSidebar.navigation ?? siteSidebar.navigation,
      collapsed: pageSidebar.collapsed ?? siteSidebar.collapsed,
      width: pageSidebar.width ?? siteSidebar.width,
      mobileBreakpoint: pageSidebar.mobileBreakpoint ?? siteSidebar.mobileBreakpoint,
      backgroundColor: pageSidebar.backgroundColor ?? siteSidebar.backgroundColor,
      textColor: pageSidebar.textColor ?? siteSidebar.textColor,
    };
  }

  // Site has no sidebar, but page provides values — build a sidebar from page config
  if (pageSidebar.navigation) {
    return {
      navigation: pageSidebar.navigation,
      collapsed: pageSidebar.collapsed ?? false,
      width: pageSidebar.width ?? 240,
      mobileBreakpoint: pageSidebar.mobileBreakpoint ?? 768,
      backgroundColor: pageSidebar.backgroundColor,
      textColor: pageSidebar.textColor,
    };
  }

  return undefined;
}
