import { listPages } from '../commands/page';
import { resolvePagesDir } from './project-detector';

/**
 * Discover all page URL paths for a Stackwright project.
 *
 * Reads the pages directory (content.yml files) and returns each page as a
 * URL-style slug (e.g. '/', '/about', '/docs/getting-started').
 *
 * Used by `stackwright test:a11y` to auto-discover pages when no explicit
 * slug list is provided.
 */
export function discoverPageSlugs(projectRoot: string): string[] {
  const pagesDir = resolvePagesDir(projectRoot);
  const result = listPages(pagesDir);
  return result.pages.map((p) => p.slug);
}
