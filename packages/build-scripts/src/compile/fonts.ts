import fs from 'fs';
import path from 'path';
import type { CompileContext } from './context';

// ---------------------------------------------------------------------------
// CSS generic font family keywords — do NOT load these from Google Fonts
// ---------------------------------------------------------------------------
const SYSTEM_FONT_KEYWORDS = new Set([
  'serif',
  'sans-serif',
  'monospace',
  'cursive',
  'fantasy',
  'system-ui',
  'ui-serif',
  'ui-sans-serif',
  'ui-monospace',
  'ui-rounded',
  'math',
  'emoji',
  'fangsong',
]);

// ---------------------------------------------------------------------------
// Pure font utilities (previously in prebuild.ts — moved here, backcompat
// re-exports remain in prebuild.ts so existing tests don't break)
// ---------------------------------------------------------------------------

/**
 * Extract Google Font names from a CSS font-family string.
 * Filters out system/generic keywords and returns only loadable font names.
 */
export function extractGoogleFontNames(fontFamily: string): string[] {
  if (!fontFamily || typeof fontFamily !== 'string') return [];
  return fontFamily
    .split(',')
    .map((name) => name.replace(/^['\"]+|['\"]+$/g, '').trim())
    .filter((name) => name && !SYSTEM_FONT_KEYWORDS.has(name.toLowerCase()));
}

/**
 * Generate a Google Fonts URL from an array of font names.
 * Format: https://fonts.googleapis.com/css2?family=Name:wght@400&display=swap
 */
export function generateGoogleFontsUrl(fonts: string[]): string {
  if (!fonts || fonts.length === 0) return '';
  const familyParams = fonts
    .map((font) => `family=${font.replace(/ /g, '+')}:wght@400`)
    .join('&');
  return `https://fonts.googleapis.com/css2?${familyParams}&display=swap`;
}

export interface FontLink {
  rel: string;
  href: string;
  crossorigin?: boolean;
}

/**
 * Extract all Google Font names from the site config's customTheme typography.
 */
export function getAllGoogleFontNames(siteConfig: unknown): string[] {
  const config = siteConfig as Record<string, unknown>;
  const customTheme = config?.customTheme as Record<string, unknown> | undefined;
  if (!customTheme) return [];
  const typography = customTheme?.typography as Record<string, unknown> | undefined;
  if (!typography) return [];
  const fontFamily = typography?.fontFamily as Record<string, string> | undefined;
  if (!fontFamily) return [];
  const primaryFonts = extractGoogleFontNames(fontFamily?.primary ?? '');
  const secondaryFonts = extractGoogleFontNames(fontFamily?.secondary ?? '');
  return [...new Set([...primaryFonts, ...secondaryFonts])];
}

/** Build external Google Fonts link tags (preconnect + stylesheet). */
function buildExternalFontLinks(fonts: string[]): FontLink[] {
  if (fonts.length === 0) return [];
  const fontsUrl = generateGoogleFontsUrl(fonts);
  if (!fontsUrl) return [];
  return [
    { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: true },
    { rel: 'stylesheet', href: fontsUrl },
  ];
}

/**
 * Generate Google Fonts link tags from a site config.
 * Uses the "external" strategy (CDN links at runtime).
 */
export function generateFontLinkTags(siteConfig: unknown): FontLink[] {
  return buildExternalFontLinks(getAllGoogleFontNames(siteConfig));
}

/**
 * Download Google Fonts and bundle them locally.
 * Downloads woff2 files to `public/fonts/`, rewrites the CSS, and returns a
 * single local stylesheet link. Falls back to external links on network errors.
 */
export async function downloadAndBundleFonts(
  fonts: string[],
  publicDir: string
): Promise<FontLink[]> {
  if (fonts.length === 0) return [];

  const fontsDir = path.join(publicDir, 'fonts');
  fs.mkdirSync(fontsDir, { recursive: true });

  const fontsUrl = generateGoogleFontsUrl(fonts);
  if (!fontsUrl) return [];

  const UA =
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

  let css: string;
  try {
    const response = await fetch(fontsUrl, { headers: { 'User-Agent': UA } });
    if (!response.ok) {
      console.warn(
        `  WARNING: Failed to fetch Google Fonts CSS (HTTP ${response.status}). Falling back to external links.`
      );
      return buildExternalFontLinks(fonts);
    }
    css = await response.text();
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(
      `  WARNING: Could not reach Google Fonts (${msg}). Falling back to external links.`
    );
    return buildExternalFontLinks(fonts);
  }

  const woff2UrlRegex = /url\((https:\/\/fonts\.gstatic\.com\/[^)]+\.woff2)\)/g;
  const woff2Urls: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = woff2UrlRegex.exec(css)) !== null) {
    if (match[1]) woff2Urls.push(match[1]);
  }

  let rewrittenCss = css;
  for (const woff2Url of woff2Urls) {
    const urlPath = new URL(woff2Url).pathname;
    const segments = urlPath.split('/').filter(Boolean);
    const localFilename = segments.slice(-2).join('-');
    const localFilePath = path.join(fontsDir, localFilename);

    try {
      const fontResponse = await fetch(woff2Url);
      if (!fontResponse.ok) {
        console.warn(
          `  WARNING: Failed to download font: ${woff2Url} (HTTP ${fontResponse.status})`
        );
        continue;
      }
      const fontBuffer = Buffer.from(await fontResponse.arrayBuffer());
      fs.writeFileSync(localFilePath, fontBuffer);
      rewrittenCss = rewrittenCss.replace(woff2Url, `/fonts/${localFilename}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`  WARNING: Failed to download font ${localFilename}: ${msg}`);
    }
  }

  fs.writeFileSync(path.join(fontsDir, 'fonts.css'), rewrittenCss, 'utf8');
  console.log(`  [OK] Bundled ${woff2Urls.length} font file(s) to public/fonts/`);

  return [{ rel: 'stylesheet', href: '/fonts/fonts.css' }];
}

// ---------------------------------------------------------------------------
// compileFonts — orchestrator
// ---------------------------------------------------------------------------

/**
 * Compile font links and write `_font-links.json`.
 *
 * Reads the processed site config from `_site.json` (written by compileSite),
 * determines font strategy, and writes the appropriate link tags.
 * No-ops (writes nothing) if no fonts are configured.
 */
export async function compileFonts(ctx: CompileContext): Promise<void> {
  const { contentOutDir, publicDir } = ctx;

  const siteJsonPath = path.join(contentOutDir, '_site.json');
  if (!fs.existsSync(siteJsonPath)) {
    throw new Error('compileFonts: _site.json not found. Run compileSite() first.');
  }

  const configWithEnvResolved = JSON.parse(fs.readFileSync(siteJsonPath, 'utf8')) as Record<
    string,
    unknown
  >;

  // _theme.json font config takes precedence over _site.json font config.
  // This lets stackwright.theme.yml override the font strategy without
  // touching stackwright.yml.
  const themeJsonPath = path.join(contentOutDir, '_theme.json');
  let effectiveFontsConfig = configWithEnvResolved.fonts as
    | { strategy?: string; local_path?: string }
    | undefined;
  if (fs.existsSync(themeJsonPath)) {
    const themeData = JSON.parse(fs.readFileSync(themeJsonPath, 'utf8')) as Record<string, unknown>;
    if (themeData.fonts) {
      effectiveFontsConfig = themeData.fonts as { strategy?: string; local_path?: string };
    }
  }

  const fontsConfig = effectiveFontsConfig;
  const fontStrategy = fontsConfig?.strategy ?? 'external';

  let fontLinks: FontLink[] = [];

  // For font name extraction, merge theme data (if any) on top of site config.
  // theme.customTheme.typography wins over site.customTheme.typography.
  const themeData = fs.existsSync(themeJsonPath)
    ? (JSON.parse(fs.readFileSync(themeJsonPath, 'utf8')) as Record<string, unknown>)
    : {};
  const configForFontNames = Object.keys(themeData).length > 0
    ? { ...configWithEnvResolved, ...themeData }
    : configWithEnvResolved;

  if (fontStrategy === 'bundle') {
    const allFonts = getAllGoogleFontNames(configForFontNames);
    if (allFonts.length > 0) {
      console.log('  Bundling fonts locally (strategy: bundle)...');
      fontLinks = await downloadAndBundleFonts(allFonts, publicDir);
    }
  } else if (fontStrategy === 'local') {
    const localPath = fontsConfig?.local_path;
    if (localPath) {
      fontLinks = [{ rel: 'stylesheet', href: localPath }];
      console.log(`  Using local fonts (strategy: local): ${localPath}`);
    } else {
      console.warn(
        '  WARNING: fonts.strategy is "local" but local_path is not set. No fonts will be loaded.'
      );
    }
  } else {
    fontLinks = generateFontLinkTags(configForFontNames);
  }

  if (fontLinks.length > 0) {
    fs.writeFileSync(
      path.join(contentOutDir, '_font-links.json'),
      JSON.stringify({ links: fontLinks }, null, 2)
    );
    console.log('  OK _font-links.json');
  }
}
