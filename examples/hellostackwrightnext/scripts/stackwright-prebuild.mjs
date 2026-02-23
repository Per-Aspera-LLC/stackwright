#!/usr/bin/env node
/**
 * Stackwright prebuild script.
 *
 * Runs before `next build` and `next dev` (via package.json prebuild/predev hooks).
 * Responsibilities:
 *   1. Read stackwright.yml (site config) — copy any co-located images to public/images/config/
 *      and rewrite their paths to /images/config/<filename>.
 *   2. Scan pages/ recursively for content.yml / content.yaml — for each page:
 *      - Copy co-located images to public/images/<slug>/ (root page → public/images/)
 *      - Rewrite relative image paths (./filename.png) to /images/<slug>/filename.png
 *   3. Write processed output as JSON to public/stackwright-content/:
 *      - _site.json  ← processed siteConfig
 *      - _root.json  ← processed root page content (pages/content.yml)
 *      - <slug>.json ← processed content for each slug page
 *
 * getStaticPaths / getStaticProps in [slug].tsx then just read these JSON files —
 * no fs usage in the shared @stackwright/nextjs library.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import yaml from 'js-yaml';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

const PAGES_DIR = path.join(rootDir, 'pages');
const PUBLIC_DIR = path.join(rootDir, 'public');
const IMAGES_DIR = path.join(PUBLIC_DIR, 'images');
const CONTENT_OUT_DIR = path.join(PUBLIC_DIR, 'stackwright-content');
const SITE_CONFIG_FILE = path.join(rootDir, 'stackwright.yml');

const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp', '.ico']);

function isImagePath(str) {
  if (typeof str !== 'string') return false;
  return IMAGE_EXTENSIONS.has(path.extname(str).toLowerCase());
}

/**
 * Copy a file if it doesn't exist at the destination or the source is newer.
 */
function copyIfNewer(src, dest) {
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
 * Recursively walk an object, rewriting image path strings.
 * @param {*} node - Any value from parsed YAML
 * @param {(str: string) => string} rewrite - Called for every string value; returns replacement
 */
function rewritePaths(node, rewrite) {
  if (typeof node === 'string') return rewrite(node);
  if (Array.isArray(node)) return node.map(item => rewritePaths(item, rewrite));
  if (node !== null && typeof node === 'object') {
    const result = {};
    for (const [k, v] of Object.entries(node)) {
      result[k] = rewritePaths(v, rewrite);
    }
    return result;
  }
  return node;
}

/**
 * Process site config: copies images from rootDir to public/images/config/
 * and rewrites their paths.
 * Handles both `./filename.png` and bare `filename.png` (no slashes, not http).
 */
function processSiteConfig(config) {
  return rewritePaths(config, str => {
    const isRelativeDot = str.startsWith('./') && isImagePath(str);
    const isBareFile = !str.includes('/') && !str.startsWith('http') && !str.startsWith('data:') && isImagePath(str);
    if (!isRelativeDot && !isBareFile) return str;

    const srcPath = path.resolve(rootDir, isRelativeDot ? str : `./${str}`);
    if (!fs.existsSync(srcPath)) {
      console.warn(`  ⚠️  Config image not found: ${srcPath}`);
      return str;
    }
    const filename = path.basename(str);
    const destPath = path.join(IMAGES_DIR, 'config', filename);
    copyIfNewer(srcPath, destPath);
    return `/images/config/${filename}`;
  });
}

/**
 * Process page content: copies images from contentDir to public/images/<slug>/
 * and rewrites their paths.
 * Only handles `./filename.png` relative paths.
 */
function processPageContent(content, contentDir, imageDestDir, publicPrefix) {
  return rewritePaths(content, str => {
    if (!str.startsWith('./') || !isImagePath(str)) return str;

    const srcPath = path.resolve(contentDir, str);
    if (!fs.existsSync(srcPath)) {
      console.warn(`  ⚠️  Content image not found: ${srcPath}`);
      return str;
    }
    const filename = path.basename(str);
    const destPath = path.join(imageDestDir, filename);
    copyIfNewer(srcPath, destPath);
    return `${publicPrefix}/${filename}`;
  });
}

/**
 * Recursively find all content.yml / content.yaml files under a directory.
 * Returns array of { slug, filePath, contentDir } objects.
 */
function findContentFiles(dir, baseSlug = '') {
  const results = [];
  if (!fs.existsSync(dir)) return results;

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      const subSlug = baseSlug ? `${baseSlug}/${entry.name}` : entry.name;
      results.push(...findContentFiles(path.join(dir, entry.name), subSlug));
    } else if (entry.name === 'content.yml' || entry.name === 'content.yaml') {
      results.push({
        slug: baseSlug || null, // null = root page
        filePath: path.join(dir, entry.name),
        contentDir: dir,
      });
    }
  }
  return results;
}

// ── Main ─────────────────────────────────────────────────────────────────────

console.log('🔨 Stackwright prebuild starting...');

fs.mkdirSync(CONTENT_OUT_DIR, { recursive: true });
fs.mkdirSync(IMAGES_DIR, { recursive: true });

// 1. Process site config
if (!fs.existsSync(SITE_CONFIG_FILE)) {
  console.error(`❌ Site config not found: ${SITE_CONFIG_FILE}`);
  process.exit(1);
}

console.log('\n📄 Processing site config...');
const rawConfig = yaml.load(fs.readFileSync(SITE_CONFIG_FILE, 'utf8'));
const processedConfig = processSiteConfig(rawConfig);
fs.writeFileSync(path.join(CONTENT_OUT_DIR, '_site.json'), JSON.stringify(processedConfig, null, 2));
console.log('  ✓ _site.json written');

// 2. Process page content files
console.log('\n📄 Processing page content...');
const contentFiles = findContentFiles(PAGES_DIR);

if (contentFiles.length === 0) {
  console.warn('  ⚠️  No content.yml files found in pages/');
}

for (const { slug, filePath, contentDir } of contentFiles) {
  const label = slug ?? '(root)';
  console.log(`  Page: ${label}`);

  const rawContent = yaml.load(fs.readFileSync(filePath, 'utf8'));

  // Determine destination image dir and public URL prefix
  const imageDestDir = slug
    ? path.join(IMAGES_DIR, slug)
    : IMAGES_DIR;
  const publicPrefix = slug ? `/images/${slug}` : '/images';

  const processedContent = processPageContent(rawContent, contentDir, imageDestDir, publicPrefix);

  // Write output JSON
  const outFile = slug ? `${slug}.json` : '_root.json';
  fs.writeFileSync(path.join(CONTENT_OUT_DIR, outFile), JSON.stringify(processedContent, null, 2));
  console.log(`  ✓ ${outFile} written`);
}

console.log('\n✅ Stackwright prebuild complete.\n');
