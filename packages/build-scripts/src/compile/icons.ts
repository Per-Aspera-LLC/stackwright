import fs from 'fs';
import path from 'path';
import type { CompileContext } from './context';
import lucideExportsList from './lucide-exports.json';
import { emit } from '../lib/prebuild-events';

// ---------------------------------------------------------------------------
// Lucide-react export allow-list (generated from lucide-react/dist/lucide-react.d.ts)
// ---------------------------------------------------------------------------

/**
 * All names that are importable from `lucide-react` — both canonical exports and
 * their deprecated aliases (e.g. both TriangleAlert AND AlertTriangle are present).
 *
 * Generated at workspace install time from `lucide-react/dist/lucide-react.d.ts`.
 * To regenerate: `node scripts/generate-lucide-exports.mjs` from packages/build-scripts/.
 */
const LUCIDE_REACT_EXPORTS: ReadonlySet<string> = new Set<string>(lucideExportsList as string[]);

/** Safe fallback icon — always present in lucide-react. Used when a YAML icon name is unknown. */
const ICON_FALLBACK = 'HelpCircle';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const LEGACY_MUI_ICON_ALIASES: Record<string, string> = {
  Speed: 'Zap',
  VerifiedUser: 'ShieldCheck',
  CloudDone: 'CloudCheck',
  Description: 'FileText',
  Language: 'Globe',
  Build: 'Wrench',
  AutoAwesome: 'Sparkles',
  Dashboard: 'LayoutDashboard',
  Api: 'Braces',
  Storage: 'Database',
  Security: 'Shield',
  People: 'Users',
  // Lucide renamed-icon backward compat
  CheckCircle: 'CircleCheck',
  AlertTriangle: 'TriangleAlert',
  Layout: 'LayoutTemplate',
};

const SYSTEM_ICON_NAMES: readonly string[] = [
  'Sun',
  'Moon',
  'Info',
  'TriangleAlert',
  'CircleAlert',
];

// ---------------------------------------------------------------------------
// Pure utilities (exported so tests can import directly if needed)
// ---------------------------------------------------------------------------

/**
 * Convert a YAML icon name (lucide.dev URL-slug convention) to lucide-react's
 * PascalCase export name.
 *
 * Handles:
 *   "alert-triangle"   -> "AlertTriangle"   (kebab-case slug)
 *   "battery-charging" -> "BatteryCharging"  (kebab-case slug)
 *   "building-2"       -> "Building2"        (kebab with digit)
 *   "activity"         -> "Activity"         (lowercase single word)
 *   "AlertTriangle"    -> "AlertTriangle"    (already PascalCase — passthrough)
 *   "X"                -> "X"               (single char — passthrough)
 *   ""                 -> ""                (empty — passthrough)
 *
 * NOTE: LEGACY_MUI_ICON_ALIASES takes precedence over this normalizer in the
 * manifest loop (alias lookup is on the raw YAML `src` string). MUI aliases
 * use PascalCase keys, so only literal MUI uses (e.g. YAML `src: "Speed"`) hit
 * the alias map. A lowercase or kebab variant (e.g. `src: "speed"`) skips the
 * alias and is normalized by this function to `Speed` — a different path and
 * different outcome, which is correct: kebab users are opting into Lucide
 * URL-slug convention, not legacy MUI names.
 */
export function lucideExportName(yamlName: string): string {
  return yamlName
    .split('-')
    .map((part) => (part.length > 0 ? part.charAt(0).toUpperCase() + part.slice(1) : part))
    .join('');
}

// ---------------------------------------------------------------------------
// Lucide export validation utilities (exported for tests + external callers)
// ---------------------------------------------------------------------------

/**
 * Returns true if `name` is a real lucide-react export (canonical OR deprecated alias).
 *
 * @example
 * isValidLucideExport('AlertTriangle') // → true  (deprecated alias, still exported)
 * isValidLucideExport('Bridge')        // → false (never existed)
 */
export function isValidLucideExport(name: string): boolean {
  return LUCIDE_REACT_EXPORTS.has(name);
}

/**
 * Resolve a YAML `icon:` value to a valid lucide-react import name.
 *
 * Resolution order:
 *   1. LEGACY_MUI_ICON_ALIASES  (PascalCase keys → new Lucide name)
 *   2. lucideExportName()        (kebab / lowercase → PascalCase)
 *   3. isValidLucideExport()     (allow-list check)
 *   4. ICON_FALLBACK on miss     (+ console.warn)
 *
 * The YAML key is preserved in the generated siteIconPreset — callers should
 * still map the original `yamlSrc` → returned value in the preset object.
 *
 * @param yamlSrc  Raw value from the YAML content file, e.g. "bridge" or "AlertTriangle".
 * @returns A valid lucide-react import identifier, e.g. "HelpCircle".
 */
export function mapToValidLucideName(yamlSrc: string): string {
  const resolved = LEGACY_MUI_ICON_ALIASES[yamlSrc] ?? lucideExportName(yamlSrc);
  if (isValidLucideExport(resolved)) {
    return resolved;
  }
  // TODO(swp-6xr3.1): upgrade warn to .stackwright/prebuild-events.ndjson structured event
  console.warn(
    `  [WARN] Icon '${yamlSrc}' resolved to '${resolved}' — not a known lucide-react export. ` +
      `Falling back to ${ICON_FALLBACK}. If this icon was renamed, add it to LEGACY_MUI_ICON_ALIASES.`
  );
  return ICON_FALLBACK;
}

/**
 * Recursively walk a value and collect all icon src references.
 *
 * Catches two shapes:
 *   1. Full icon object:    { type: "icon", src: "Truck" }
 *   2. Shorthand property:  { icon: "Truck", type: "metric_card" }
 */
export function collectIconSrcs(obj: unknown, srcs: Set<string>): void {
  if (!obj || typeof obj !== 'object') return;
  if (Array.isArray(obj)) {
    for (const item of obj) collectIconSrcs(item, srcs);
    return;
  }
  const record = obj as Record<string, unknown>;
  if (record.type === 'icon' && typeof record.src === 'string') {
    srcs.add(record.src);
  }
  if (typeof record.icon === 'string' && record.icon.length > 0) {
    srcs.add(record.icon);
  }
  for (const val of Object.values(record)) {
    collectIconSrcs(val, srcs);
  }
}

// ---------------------------------------------------------------------------
// generateIconManifest (previously exported from prebuild.ts)
// ---------------------------------------------------------------------------

/**
 * Walk all processed JSON output files and generate:
 *   1. `_icon-manifest.json` — debug artifact in contentOutDir
 *   2. `stackwright-generated/icons.ts` — static lucide imports + registerSiteIcons()
 *
 * Synchronous: all operations are JSON parsing and file writes.
 */
export function generateIconManifest(contentOutDir: string, projectRoot: string): void {
  const startTime = Date.now();
  emit({ type: 'prebuild_start', step: 'icon-scan' }, { projectRoot });

  const rawSrcs = new Set<string>();

  function walkJsonDir(dir: string): void {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walkJsonDir(fullPath);
      } else if (entry.name.endsWith('.json') && entry.name !== '_icon-manifest.json') {
        try {
          const data = JSON.parse(fs.readFileSync(fullPath, 'utf8')) as unknown;
          collectIconSrcs(data, rawSrcs);
        } catch {
          // Skip malformed JSON
        }
      }
    }
  }
  walkJsonDir(contentOutDir);

  const lucideImports = new Map<string, Set<string>>();

  for (const sysName of SYSTEM_ICON_NAMES) {
    if (!lucideImports.has(sysName)) lucideImports.set(sysName, new Set());
    lucideImports.get(sysName)!.add(sysName);
  }

  const unknownIcons: string[] = [];

  for (const src of rawSrcs) {
    // Precedence: explicit MUI legacy alias > kebab/lowercase normalization > allow-list check.
    const resolved = LEGACY_MUI_ICON_ALIASES[src] ?? lucideExportName(src);
    let lucideName: string;
    if (isValidLucideExport(resolved)) {
      lucideName = resolved;
    } else {
      // resolved !== ICON_FALLBACK guard avoids double-counting an explicit 'icon: HelpCircle'
      // TODO(swp-6xr3.1): upgrade warn to .stackwright/prebuild-events.ndjson structured event
      console.warn(
        `  [WARN] Icon '${src}' → '${resolved}' is not a lucide-react export; using ${ICON_FALLBACK}.`
      );
      lucideName = ICON_FALLBACK;
      unknownIcons.push(src);
      emit({ type: 'icon_fallback', src, resolved, fallback: ICON_FALLBACK }, { projectRoot });
    }
    if (!lucideImports.has(lucideName)) lucideImports.set(lucideName, new Set());
    lucideImports.get(lucideName)!.add(src);
  }

  emit(
    {
      type: 'icons_summary',
      totalIcons: rawSrcs.size,
      unknownCount: unknownIcons.length,
      unknownIcons: [...unknownIcons],
    },
    { projectRoot }
  );

  if (unknownIcons.length > 0) {
    console.warn(
      `  [WARN] ${unknownIcons.length} icon(s) fell back to ${ICON_FALLBACK} (check YAML content for typos): ${unknownIcons.join(', ')}`
    );
  }

  fs.writeFileSync(
    path.join(contentOutDir, '_icon-manifest.json'),
    JSON.stringify(
      {
        generated: new Date().toISOString(),
        siteIcons: Array.from(rawSrcs).sort(),
        systemIcons: Array.from(SYSTEM_ICON_NAMES),
        totalUniqueLucideImports: lucideImports.size,
      },
      null,
      2
    )
  );

  const generatedDir = path.join(projectRoot, 'stackwright-generated');
  fs.mkdirSync(generatedDir, { recursive: true });

  const sortedLucideNames = Array.from(lucideImports.keys()).sort();

  const lines: string[] = [
    '// GENERATED by stackwright-prebuild -- do not edit.',
    '// To regenerate: pnpm predev (or pnpm prebuild)',
    '//',
    '// This file is safe to commit. It will be updated whenever your YAML content changes.',
    '',
    `import { ${sortedLucideNames.join(', ')} } from 'lucide-react';`,
    `import {`,
    `  BlueSkyIcon,`,
    `  StackwrightIcon,`,
    `  registerStackwrightIcons,`,
    `} from '@stackwright/icons';`,
    '',
    '// eslint-disable-next-line @typescript-eslint/no-explicit-any',
    'const siteIconPreset: Record<string, React.ComponentType<any>> = {',
  ];

  for (const [lucideName, yamlNames] of [...lucideImports.entries()].sort()) {
    for (const yamlName of [...yamlNames].sort()) {
      if (yamlName === lucideName) {
        lines.push(`  ${lucideName},`);
      } else {
        // yamlName is either a legacy MUI alias (PascalCase → different PascalCase)
        // or a kebab-case / lowercase Lucide URL-slug (e.g. 'alert-triangle' → AlertTriangle).
        // Either way: string-keyed entry so runtime lookup by YAML name still works.
        const isMuiAlias = yamlName in LEGACY_MUI_ICON_ALIASES;
        const comment = isMuiAlias ? ' // legacy MUI alias -- candidate for deprecation' : '';
        lines.push(`  '${yamlName}': ${lucideName},${comment}`);
      }
    }
  }

  lines.push(
    '  // Brand icons -- always included',
    '  bluesky: BlueSkyIcon,',
    '  stackwright: StackwrightIcon,',
    '};',
    '',
    'export function registerSiteIcons(): void {',
    '  registerStackwrightIcons(siteIconPreset);',
    '}',
    ''
  );

  fs.writeFileSync(path.join(generatedDir, 'icons.ts'), lines.join('\n'));
  emit({ type: 'file_generated', path: path.join(generatedDir, 'icons.ts') }, { projectRoot });

  console.log(
    `  [OK] Icon manifest: ${rawSrcs.size} site icon(s) + ${SYSTEM_ICON_NAMES.length} system icon(s) -> ${lucideImports.size} unique lucide import(s)`
  );
  console.log(`  [OK] Generated stackwright-generated/icons.ts`);

  emit(
    { type: 'prebuild_complete', step: 'icon-scan', durationMs: Date.now() - startTime },
    { projectRoot }
  );
}

// ---------------------------------------------------------------------------
// compileIcons orchestrator
// ---------------------------------------------------------------------------

/**
 * Generate the icon manifest and static icon registration file.
 * Must run after compileSite + compilePages (needs all JSON files in contentOutDir).
 * Synchronous: all operations are JSON parsing and file writes.
 */
export function compileIcons(ctx: CompileContext): void {
  console.log('\nGenerating icon manifest...');
  generateIconManifest(ctx.contentOutDir, ctx.projectRoot);
}
