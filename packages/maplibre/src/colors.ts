/**
 * Color-token resolution — G7 pivot fix (swp-ndvv.28 follow-up).
 *
 * G3/G7 root cause: when an otter pivots from Cesium to MapLibre, MapLibre's
 * GL style spec requires *literal* paint colors for layers — it cannot
 * consume `var(--sw-color-x)` or a bare token name — so the otter fell back
 * to hand-copied raw hex in `colorMap`. The design rule (human-approved,
 * mirrored from `pro/packages/cesium/src/colors.ts`, swp-0ifi) is: authors
 * always write theme tokens (`status-ok`, `brand-primary`, a bare
 * `ThemeColors` key, or an explicit `--sw-color-*`/`var(--sw-color-*, …)`
 * reference); the *framework* resolves them per-surface. This module is
 * that boundary for `@stackwright/maplibre`.
 *
 * Two surfaces, two different resolution strategies:
 *
 * - **Markers** are React-rendered inline `<svg>` elements that stay mounted
 *   in the live DOM (unlike Cesium, which bakes marker SVG into a data-URL
 *   *before* it ever reaches a document — see the cesium module's docblock).
 *   Because a MapLibre marker really is in the DOM, `fill="var(--sw-color-x)"`
 *   just works and stays live across CSS-driven theme/color-mode changes for
 *   free. `toCssColor()` is the "cheap path": it never resolves anything
 *   itself, it only rewrites a bare token into a `var(...)` reference (or
 *   passes literals/existing `var()` calls through unchanged) and lets the
 *   browser do the rest.
 * - **Layers** (polylines/polygons/GeoJSON) go through maplibre-gl `paint`
 *   properties, which are evaluated by MapLibre's own style-spec parser, not
 *   the browser's CSS cascade — `var(...)` is meaningless there and a bare
 *   token string is just invalid paint data. `resolveTokenColor()` (ported
 *   from pro's `resolveTokenColor`, same classification + `getComputedStyle`
 *   read) resolves those to a literal CSS color string at layer-build time,
 *   the same boundary cesium's version sits at.
 *
 * Naming: tokens resolve against `--sw-color-<kebab-name>` custom
 * properties — verified against `@stackwright/themes`' `themeToCSSVars()`
 * (the OSS 12 base/foreground keys) and `@stackwright/build-scripts`'
 * `validateColorRefs.ts` (confirms pro plugins extend the same `--sw-color-*`
 * vocabulary for richer tokens like `status-ok`/`brand-primary` via a
 * project's compiled `_theme-tokens.css`). This is the exact prefix pro's
 * `colors.ts` already uses — mirrored here, not reinvented.
 */

// ---------------------------------------------------------------------------
// Error type
// ---------------------------------------------------------------------------

/** Thrown by resolveTokenColor instead of ever returning undefined/empty. */
export class MapLibreColorError extends Error {
  /** The unresolved CSS custom-property name (e.g. `--sw-color-status-ok`) or raw input. */
  readonly token: string;

  constructor(token: string, context?: string) {
    super(
      `MapLibreColorError: unresolved color token "${token}"${context ? ` (${context})` : ''}. ` +
        `Define the corresponding custom property in :root (or wherever ` +
        `@stackwright/themes injects theme CSS vars), or pass opts.fallback.`
    );
    this.name = 'MapLibreColorError';
    this.token = token;
  }
}

// ---------------------------------------------------------------------------
// Options
// ---------------------------------------------------------------------------

export interface ResolveTokenColorOptions {
  /** Element to read the custom property from. Defaults to document.documentElement (:root). */
  el?: Element;
  /** Used when the token/var() has no inline fallback and doesn't resolve. */
  fallback?: string;
  /** Human-readable location, folded into thrown errors (e.g. "layer polygon-0 fillColor"). */
  context?: string;
}

// ---------------------------------------------------------------------------
// Classification (shared by both resolution strategies)
// ---------------------------------------------------------------------------

const HEX_RE = /^#[0-9a-f]{3,8}$/i;
const FUNC_COLOR_RE = /^(?:rgb|rgba|hsl|hsla|hwb|lab|lch|oklab|oklch|color)\(/i;
const VAR_RE = /^var\(\s*(--[a-zA-Z0-9-]+)\s*(?:,\s*([\s\S]+))?\)$/;
const SW_TOKEN_PREFIX_RE = /^sw-color-[a-zA-Z0-9-]+$/i;
const BARE_WORD_RE = /^[a-zA-Z][a-zA-Z0-9-]*$/;

// CSS Level 4 named colors + 'transparent'/'currentcolor' — passthrough as
// literals rather than being treated as token names. Kept identical to
// pro's list (same problem, same answer).
const CSS_NAMED_COLORS = new Set([
  'transparent',
  'currentcolor',
  'black',
  'silver',
  'gray',
  'grey',
  'white',
  'maroon',
  'red',
  'purple',
  'fuchsia',
  'magenta',
  'green',
  'lime',
  'olive',
  'yellow',
  'navy',
  'blue',
  'teal',
  'aqua',
  'cyan',
  'orange',
  'aliceblue',
  'antiquewhite',
  'aquamarine',
  'azure',
  'beige',
  'bisque',
  'blanchedalmond',
  'blueviolet',
  'brown',
  'burlywood',
  'cadetblue',
  'chartreuse',
  'chocolate',
  'coral',
  'cornflowerblue',
  'cornsilk',
  'crimson',
  'darkblue',
  'darkcyan',
  'darkgoldenrod',
  'darkgray',
  'darkgreen',
  'darkgrey',
  'darkkhaki',
  'darkmagenta',
  'darkolivegreen',
  'darkorange',
  'darkorchid',
  'darkred',
  'darksalmon',
  'darkseagreen',
  'darkslateblue',
  'darkslategray',
  'darkslategrey',
  'darkturquoise',
  'darkviolet',
  'deeppink',
  'deepskyblue',
  'dimgray',
  'dimgrey',
  'dodgerblue',
  'firebrick',
  'floralwhite',
  'forestgreen',
  'gainsboro',
  'ghostwhite',
  'gold',
  'goldenrod',
  'greenyellow',
  'honeydew',
  'hotpink',
  'indianred',
  'indigo',
  'ivory',
  'khaki',
  'lavender',
  'lavenderblush',
  'lawngreen',
  'lemonchiffon',
  'lightblue',
  'lightcoral',
  'lightcyan',
  'lightgoldenrodyellow',
  'lightgray',
  'lightgreen',
  'lightgrey',
  'lightpink',
  'lightsalmon',
  'lightseagreen',
  'lightskyblue',
  'lightslategray',
  'lightslategrey',
  'lightsteelblue',
  'lightyellow',
  'limegreen',
  'linen',
  'mediumaquamarine',
  'mediumblue',
  'mediumorchid',
  'mediumpurple',
  'mediumseagreen',
  'mediumslateblue',
  'mediumspringgreen',
  'mediumturquoise',
  'mediumvioletred',
  'midnightblue',
  'mintcream',
  'mistyrose',
  'moccasin',
  'navajowhite',
  'oldlace',
  'olivedrab',
  'orangered',
  'orchid',
  'palegoldenrod',
  'palegreen',
  'paleturquoise',
  'palevioletred',
  'papayawhip',
  'peachpuff',
  'peru',
  'pink',
  'plum',
  'powderblue',
  'rebeccapurple',
  'rosybrown',
  'royalblue',
  'saddlebrown',
  'salmon',
  'sandybrown',
  'seagreen',
  'seashell',
  'sienna',
  'skyblue',
  'slateblue',
  'slategray',
  'slategrey',
  'snow',
  'springgreen',
  'steelblue',
  'tan',
  'thistle',
  'tomato',
  'turquoise',
  'violet',
  'wheat',
  'whitesmoke',
  'yellowgreen',
]);

type ColorKind = 'literal' | 'var' | 'bareToken';

function classify(raw: string): ColorKind {
  if (HEX_RE.test(raw) || FUNC_COLOR_RE.test(raw)) return 'literal';
  if (VAR_RE.test(raw)) return 'var';
  if (SW_TOKEN_PREFIX_RE.test(raw)) return 'bareToken';
  if (CSS_NAMED_COLORS.has(raw.toLowerCase())) return 'literal';
  if (BARE_WORD_RE.test(raw)) return 'bareToken';
  // Unrecognized syntax — treat as literal and let the consumer (maplibre-gl
  // style parser, or the browser's fill attribute) be the final word.
  return 'literal';
}

/** camelCase/PascalCase -> kebab-case; already-kebab input passes through. */
function toKebab(input: string): string {
  return input.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
}

/** Bare token name -> its `--sw-color-*` custom-property name. */
function tokenToVarName(raw: string): string {
  return SW_TOKEN_PREFIX_RE.test(raw) ? `--${raw}` : `--sw-color-${toKebab(raw)}`;
}

// ---------------------------------------------------------------------------
// Markers: cheap path — rewrite to var(), let the DOM/CSS cascade resolve it
// ---------------------------------------------------------------------------

/**
 * Rewrites a `MapMarker.color` value into something a mounted-DOM SVG
 * `fill` attribute can use. Never resolves or throws — literal CSS colors
 * and existing `var(...)` references pass through unchanged; a bare token
 * (`status-ok`, `sw-color-status-ok`) becomes `var(--sw-color-status-ok)`.
 *
 * Safe to call with `undefined` — returns `undefined` so callers can still
 * apply their own default (e.g. `DEFAULT_MARKER_COLOR`).
 */
export function toCssColor(input: string | undefined): string | undefined {
  if (input === undefined) return undefined;
  const raw = input.trim();
  if (raw === '') return raw;
  const kind = classify(raw);
  if (kind === 'literal' || kind === 'var') return raw;
  return `var(${tokenToVarName(raw)})`;
}

// ---------------------------------------------------------------------------
// Layers: getComputedStyle resolution — maplibre-gl paint props need literals
// ---------------------------------------------------------------------------

function readCustomProperty(varName: string, el?: Element): string {
  if (typeof document === 'undefined' || typeof getComputedStyle === 'undefined') {
    throw new MapLibreColorError(
      varName,
      'resolveTokenColor called outside a mounted browser document — this must ' +
        'only run client-side (never during SSR/pre-mount)'
    );
  }
  const target = el ?? document.documentElement;
  const value = getComputedStyle(target).getPropertyValue(varName);
  return value ? value.trim() : '';
}

/**
 * Resolve a color-ish input string to a literal CSS color maplibre-gl `paint`
 * properties can consume. Never returns undefined/empty — throws
 * `MapLibreColorError` naming the unresolved token instead, unless
 * `opts.fallback` is given (in which case that's returned instead of
 * throwing).
 */
export function resolveTokenColor(input: string, opts: ResolveTokenColorOptions = {}): string {
  const raw = input.trim();
  const kind = classify(raw);

  if (kind === 'literal') {
    return raw;
  }

  if (kind === 'var') {
    const match = VAR_RE.exec(raw)!;
    const varName = match[1]!;
    const inlineFallback = match[2]?.trim();
    const resolved = readCustomProperty(varName, opts.el);
    if (resolved) return resolved;
    if (inlineFallback) return resolveTokenColor(inlineFallback, opts);
    if (opts.fallback) return opts.fallback;
    throw new MapLibreColorError(varName, opts.context);
  }

  // bareToken
  const varName = tokenToVarName(raw);
  const resolved = readCustomProperty(varName, opts.el);
  if (resolved) return resolved;
  if (opts.fallback) return opts.fallback;
  throw new MapLibreColorError(varName, opts.context);
}

/** Formats a caught color error for the layer-level error overlay. Exported for tests. */
export function describeColorError(prefixLabel: string, err: unknown): string {
  if (err instanceof MapLibreColorError) {
    return `${prefixLabel}: unresolved color token ${err.token}`;
  }
  const message = err instanceof Error ? err.message : String(err);
  return `${prefixLabel}: ${message}`;
}
