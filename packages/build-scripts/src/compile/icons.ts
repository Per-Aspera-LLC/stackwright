import fs from 'fs';
import path from 'path';
import type { CompileContext } from './context';

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

  for (const src of rawSrcs) {
    // Precedence: explicit MUI legacy alias > kebab/lowercase normalization.
    // Alias keys are PascalCase, so only literal MUI YAML names hit the map.
    const lucideName = LEGACY_MUI_ICON_ALIASES[src] ?? lucideExportName(src);
    if (!lucideImports.has(lucideName)) lucideImports.set(lucideName, new Set());
    lucideImports.get(lucideName)!.add(src);
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

  console.log(
    `  [OK] Icon manifest: ${rawSrcs.size} site icon(s) + ${SYSTEM_ICON_NAMES.length} system icon(s) -> ${lucideImports.size} unique lucide import(s)`
  );
  console.log(`  [OK] Generated stackwright-generated/icons.ts`);
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
