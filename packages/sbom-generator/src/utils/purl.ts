/**
 * Package URL (PURL) generation utilities
 * @package @stackwright/sbom-generator
 * @see https://github.com/package-url/purl-spec
 */

/**
 * PURL types supported by this generator
 */
export type PURLType = 'npm' | 'github' | 'pypi' | 'maven' | 'gem' | 'nuget';

/**
 * Generate a standard Package URL (PURL)
 * Format: pkg:<type>/<namespace>/<name>@<version>[?qualifiers][#subpath]
 *
 * @param options - PURL generation options
 * @returns Properly formatted PURL string
 */
export function createPURL(options: {
  type: PURLType;
  namespace?: string;
  name: string;
  version?: string;
  qualifiers?: Record<string, string>;
  subpath?: string;
}): string {
  const { type, namespace, name, version, qualifiers, subpath } = options;

  const parts: string[] = [`pkg:${type}`];

  // Add namespace if present
  if (namespace) {
    parts.push(namespace);
  }

  // Add name (always required)
  parts.push(name);

  // Add version with @ prefix
  if (version) {
    const v = parts.pop()!;
    parts.push(`${v}@${version}`);
  }

  // Add qualifiers
  if (qualifiers && Object.keys(qualifiers).length > 0) {
    const qs = new URLSearchParams(qualifiers).toString();
    const last = parts[parts.length - 1];
    parts[parts.length - 1] = `${last}?${qs}`;
  }

  // Add subpath with # prefix
  if (subpath) {
    const last = parts.pop()!;
    parts.push(`${last}#${subpath}`);
  }

  return parts.join('/');
}

/**
 * Generate npm PURL
 * @param name - Package name (supports scoped packages like @scope/name)
 * @param version - Package version
 * @returns npm PURL string
 */
export function npmPURL(name: string, version?: string): string {
  // Handle scoped packages (@scope/name)
  const [scopePart, ...nameParts] = name.split('/');

  if (scopePart.startsWith('@')) {
    return createPURL({
      type: 'npm',
      namespace: scopePart.slice(1),
      name: nameParts.join('/'),
      version,
    });
  }

  return createPURL({
    type: 'npm',
    name: scopePart,
    version,
  });
}

/**
 * Generate GitHub PURL
 * @param owner - Repository owner
 * @param repo - Repository name
 * @param version - Tag or commit SHA
 * @returns GitHub PURL string
 */
export function githubPURL(owner: string, repo: string, version?: string): string {
  return createPURL({
    type: 'github',
    namespace: owner,
    name: repo,
    version,
  });
}

/**
 * Parse a PURL back into its components
 * @param purl - The PURL string to parse
 * @returns Parsed PURL components
 */
export function parsePURL(purl: string): {
  type: PURLType;
  namespace?: string;
  name: string;
  version?: string;
  qualifiers?: Record<string, string>;
  subpath?: string;
} | null {
  try {
    // Remove scheme prefix
    const withoutScheme = purl.replace(/^pkg:/, '');

    // Split by / to get components
    const parts = withoutScheme.split('/');
    const type = parts[0] as PURLType;

    let remaining = parts.slice(1);
    let namespace: string | undefined;
    let name: string;
    let version: string | undefined;
    let qualifiers: Record<string, string> | undefined;
    let subpath: string | undefined;

    // Handle @ in version (e.g., name@version)
    if (remaining.length > 0) {
      const lastPart = remaining[remaining.length - 1];

      // Check for version in last part
      if (lastPart.includes('@')) {
        const [n, v] = lastPart.split('@');
        remaining[remaining.length - 1] = n;
        version = v;
      }

      // Check for subpath
      const hashIndex = lastPart.indexOf('#');
      if (hashIndex !== -1) {
        subpath = lastPart.slice(hashIndex + 1);
        remaining[remaining.length - 1] = lastPart.slice(0, hashIndex);
      }

      // Check for qualifiers
      const questIndex = remaining[remaining.length - 1].indexOf('?');
      if (questIndex !== -1) {
        const qs = remaining[remaining.length - 1].slice(questIndex + 1);
        remaining[remaining.length - 1] = remaining[remaining.length - 1].slice(0, questIndex);
        qualifiers = Object.fromEntries(new URLSearchParams(qs));
      }
    }

    // Namespace is everything before name in non-npm packages
    if (type !== 'npm' && remaining.length > 1) {
      namespace = remaining[0];
      remaining = remaining.slice(1);
    }

    name = remaining.join('/');

    return { type, namespace, name, version, qualifiers, subpath };
  } catch {
    return null;
  }
}
