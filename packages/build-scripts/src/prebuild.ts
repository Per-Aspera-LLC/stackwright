/**
 * stackwright-prebuild
 *
 * Run before `next build` and `next dev` to process co-located images and
 * compile YAML content files into JSON that getStaticProps can read without
 * touching the filesystem at runtime.
 *
 * Usage (package.json):
 *   "prebuild": "stackwright-prebuild",
 *   "predev":   "stackwright-prebuild"
 *
 * Output (written to public/stackwright-content/):
 *   _site.json          ← processed site config (stackwright.yml)
 *   _root.json          ← processed root page (pages/content.yml)
 *   <slug>.json         ← processed content for each slug page
 *
 * Images are copied to public/images/ with directory structure preserved.
 */

import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

// ── Config ────────────────────────────────────────────────────────────────────

const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp', '.ico']);

// ── Helpers ───────────────────────────────────────────────────────────────────

function isImagePath(str: string): boolean {
  return IMAGE_EXTENSIONS.has(path.extname(str).toLowerCase());
}

/** Copy src → dest only if dest is missing or older than src. */
function copyIfNewer(src: string, dest: string, rootDir: string): void {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  if (
    !fs.existsSync(dest) ||
    fs.statSync(src).mtimeMs > fs.statSync(dest).mtimeMs
  ) {
    fs.copyFileSync(src, dest);
    console.log(`  📸 ${path.relative(rootDir, src)} → ${path.relative(rootDir, dest)}`);
  }
}

/**
 * Walk any JSON-compatible value, calling rewrite() on every string.
 * Returns a new deep copy with rewritten strings.
 */
function rewritePaths(node: unknown, rewrite: (s: string) => string): unknown {
  if (typeof node === 'string') return rewrite(node);
  if (Array.isArray(node)) return node.map(item => rewritePaths(item, rewrite));
  if (node !== null && typeof node === 'object') {
    const result: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(node as Record<string, unknown>)) {
      result[k] = rewritePaths(v, rewrite);
    }
    return result;
  }
  return node;
}

/**
 * Process site config (stackwright.yml).
 * Copies images to public/images/config/ and rewrites paths.
 * Handles:
 *   - `./filename.png`  relative with dot-slash
 *   - `filename.png`    bare filename (no slash, not http/data)
 */
function processSiteConfig(
  config: unknown,
  rootDir: string,
  imagesDir: string
): unknown {
  return rewritePaths(config, str => {
    const isRelativeDot = str.startsWith('./') && isImagePath(str);
    const isBareFile =
      !str.includes('/') &&
      !str.startsWith('http') &&
      !str.startsWith('data:') &&
      isImagePath(str);

    if (!isRelativeDot && !isBareFile) return str;

    const srcPath = path.resolve(rootDir, isRelativeDot ? str : `./${str}`);
    if (!fs.existsSync(srcPath)) {
      console.warn(`  ⚠️  Config image not found: ${srcPath}`);
      return str;
    }

    const filename = path.basename(str);
    const destPath = path.join(imagesDir, 'config', filename);
    copyIfNewer(srcPath, destPath, rootDir);
    return `/images/config/${filename}`;
  });
}

/**
 * Process a single page's content YAML.
 * Copies `./relative` images to imageDestDir and rewrites paths to publicPrefix/filename.
 */
function processPageContent(
  content: unknown,
  contentDir: string,
  imageDestDir: string,
  publicPrefix: string,
  rootDir: string
): unknown {
  return rewritePaths(content, str => {
    if (!str.startsWith('./') || !isImagePath(str)) return str;

    const srcPath = path.resolve(contentDir, str);
    if (!fs.existsSync(srcPath)) {
      console.warn(`  ⚠️  Content image not found: ${srcPath}`);
      return str;
    }

    const filename = path.basename(str);
    const destPath = path.join(imageDestDir, filename);
    copyIfNewer(srcPath, destPath, rootDir);
    return `${publicPrefix}/${filename}`;
  });
}

interface ContentFile {
  /** URL slug, or null for the root page. */
  slug: string | null;
  filePath: string;
  contentDir: string;
}

/** Recursively find all content.yml / content.yaml files under dir. */
function findContentFiles(dir: string, baseSlug = ''): ContentFile[] {
  const results: ContentFile[] = [];
  if (!fs.existsSync(dir)) return results;

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      const subSlug = baseSlug ? `${baseSlug}/${entry.name}` : entry.name;
      results.push(...findContentFiles(path.join(dir, entry.name), subSlug));
    } else if (entry.name === 'content.yml' || entry.name === 'content.yaml') {
      results.push({
        slug: baseSlug || null,
        filePath: path.join(dir, entry.name),
        contentDir: dir,
      });
    }
  }
  return results;
}

// ── Main ──────────────────────────────────────────────────────────────────────

export function runPrebuild(projectRoot = process.cwd()): void {
  const pagesDir = path.join(projectRoot, 'pages');
  const publicDir = path.join(projectRoot, 'public');
  const imagesDir = path.join(publicDir, 'images');
  const contentOutDir = path.join(publicDir, 'stackwright-content');

  const siteConfigCandidates = [
    path.join(projectRoot, 'stackwright.yml'),
    path.join(projectRoot, 'stackwright.yaml'),
  ];

  console.log('🔨 Stackwright prebuild starting...');

  fs.mkdirSync(contentOutDir, { recursive: true });
  fs.mkdirSync(imagesDir, { recursive: true });

  // 1. Process site config
  const siteConfigFile = siteConfigCandidates.find(p => fs.existsSync(p));
  if (!siteConfigFile) {
    console.error(`❌ Site config not found. Expected stackwright.yml in: ${projectRoot}`);
    process.exit(1);
  }

  console.log('\n📄 Processing site config...');
  const rawConfig = yaml.load(fs.readFileSync(siteConfigFile, 'utf8'));
  const processedConfig = processSiteConfig(rawConfig, projectRoot, imagesDir);
  fs.writeFileSync(
    path.join(contentOutDir, '_site.json'),
    JSON.stringify(processedConfig, null, 2)
  );
  console.log('  ✓ _site.json');

  // 2. Process page content files
  console.log('\n📄 Processing pages...');
  const contentFiles = findContentFiles(pagesDir);

  if (contentFiles.length === 0) {
    console.warn('  ⚠️  No content.yml files found in pages/');
  }

  for (const { slug, filePath, contentDir } of contentFiles) {
    const label = slug ?? '(root)';
    const rawContent = yaml.load(fs.readFileSync(filePath, 'utf8'));

    const slugDir = slug ?? '_root';
    const imageDestDir = path.join(imagesDir, slugDir);
    const publicPrefix = `/images/${slugDir}`;

    const processedContent = processPageContent(
      rawContent,
      contentDir,
      imageDestDir,
      publicPrefix,
      projectRoot
    );

    const outFile = slug ? `${slug}.json` : '_root.json';
    fs.writeFileSync(
      path.join(contentOutDir, outFile),
      JSON.stringify(processedContent, null, 2)
    );
    console.log(`  ✓ ${outFile}  (${label})`);
  }

  console.log('\n✅ Stackwright prebuild complete.\n');
}

// Run when executed directly as a CLI (not when required as a module)
if (require.main === module) {
  runPrebuild();
}
