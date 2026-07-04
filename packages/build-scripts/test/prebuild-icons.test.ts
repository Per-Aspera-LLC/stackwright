import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import {
  collectIconSrcs,
  lucideExportName,
  generateIconManifest,
  isValidLucideExport,
  mapToValidLucideName,
} from '../src/prebuild';

describe('collectIconSrcs', () => {
  // ── Shape 1: { type: "icon", src: "..." } ─────────────────────────────

  it('collects icon from { type: "icon", src: "Truck" }', () => {
    const srcs = new Set<string>();
    collectIconSrcs({ type: 'icon', src: 'Truck' }, srcs);
    expect(srcs).toEqual(new Set(['Truck']));
  });

  it('collects multiple OSS icon objects from nested content', () => {
    const srcs = new Set<string>();
    collectIconSrcs(
      {
        content: {
          content_items: [
            { type: 'icon', src: 'Sun' },
            { type: 'text_block', heading: { text: 'Hello' } },
            { type: 'icon', src: 'Moon' },
          ],
        },
      },
      srcs
    );
    expect(srcs).toEqual(new Set(['Sun', 'Moon']));
  });

  // ── Shape 2: { icon: "..." } shorthand ────────────────────────────────

  it('collects icon from metric_card_pulse shorthand', () => {
    const srcs = new Set<string>();
    collectIconSrcs(
      {
        type: 'metric_card_pulse',
        collection: 'weather-alerts',
        label: 'Active Alerts',
        icon: 'AlertTriangle',
        color: 'destructive',
      },
      srcs
    );
    expect(srcs).toEqual(new Set(['AlertTriangle']));
  });

  it('collects icon from metric_card shorthand', () => {
    const srcs = new Set<string>();
    collectIconSrcs({ type: 'metric_card', icon: 'Users', label: 'Patients' }, srcs);
    expect(srcs).toEqual(new Set(['Users']));
  });

  it('collects icon from stat_bar shorthand', () => {
    const srcs = new Set<string>();
    collectIconSrcs({ type: 'stat_bar', icon: 'Zap', label: 'Power' }, srcs);
    expect(srcs).toEqual(new Set(['Zap']));
  });

  // ── Deeply nested Pro dashboard structure ──────────────────────────────

  it('collects icons from deeply nested pulse_provider > grid > metric_card_pulse', () => {
    const srcs = new Set<string>();
    collectIconSrcs(
      {
        content: {
          content_items: [
            {
              type: 'pulse_provider',
              interval: 5000,
              collections: ['weather-alerts'],
              content_items: [
                {
                  type: 'grid',
                  columns: [
                    {
                      width: 1,
                      content_items: [
                        {
                          type: 'metric_card_pulse',
                          collection: 'weather-alerts',
                          label: 'Active Alerts',
                          icon: 'AlertTriangle',
                          color: 'destructive',
                        },
                      ],
                    },
                    {
                      width: 1,
                      content_items: [
                        {
                          type: 'metric_card_pulse',
                          collection: 'patient-tracking',
                          label: 'Patients Pending',
                          icon: 'Users',
                          color: 'warning',
                        },
                      ],
                    },
                    {
                      width: 1,
                      content_items: [
                        {
                          type: 'metric_card_pulse',
                          collection: 'facility-status',
                          label: 'Facilities Online',
                          icon: 'Building',
                          color: 'success',
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      },
      srcs
    );
    expect(srcs).toEqual(new Set(['AlertTriangle', 'Users', 'Building']));
  });

  // ── Mixed shapes ──────────────────────────────────────────────────────

  it('collects both OSS icon objects and Pro shorthand from same tree', () => {
    const srcs = new Set<string>();
    collectIconSrcs(
      {
        content_items: [
          { type: 'icon', src: 'Sun' },
          { type: 'metric_card', icon: 'Truck', label: 'Transport' },
          { type: 'icon', src: 'Moon' },
          { type: 'stat_bar', icon: 'Zap', label: 'Power' },
        ],
      },
      srcs
    );
    expect(srcs).toEqual(new Set(['Sun', 'Moon', 'Truck', 'Zap']));
  });

  // ── Edge cases ────────────────────────────────────────────────────────

  it('ignores empty icon string', () => {
    const srcs = new Set<string>();
    collectIconSrcs({ type: 'metric_card', icon: '', label: 'Empty' }, srcs);
    expect(srcs.size).toBe(0);
  });

  it('ignores non-string icon values', () => {
    const srcs = new Set<string>();
    collectIconSrcs({ type: 'metric_card', icon: 42, label: 'Number' }, srcs);
    collectIconSrcs({ type: 'metric_card', icon: true, label: 'Bool' }, srcs);
    collectIconSrcs({ type: 'metric_card', icon: null, label: 'Null' }, srcs);
    expect(srcs.size).toBe(0);
  });

  it('deduplicates same icon name from multiple sources', () => {
    const srcs = new Set<string>();
    collectIconSrcs(
      {
        content_items: [
          { type: 'metric_card', icon: 'Truck' },
          { type: 'metric_card_pulse', icon: 'Truck' },
          { type: 'icon', src: 'Truck' },
        ],
      },
      srcs
    );
    expect(srcs).toEqual(new Set(['Truck']));
    expect(srcs.size).toBe(1);
  });

  it('handles null and undefined input gracefully', () => {
    const srcs = new Set<string>();
    collectIconSrcs(null, srcs);
    collectIconSrcs(undefined, srcs);
    collectIconSrcs('', srcs);
    collectIconSrcs(42, srcs);
    expect(srcs.size).toBe(0);
  });

  it('handles deeply nested arrays', () => {
    const srcs = new Set<string>();
    collectIconSrcs([[[{ type: 'metric_card', icon: 'Navigation' }]]], srcs);
    expect(srcs).toEqual(new Set(['Navigation']));
  });
});

// ---------------------------------------------------------------------------
// lucideExportName — unit tests
// ---------------------------------------------------------------------------

describe('lucideExportName', () => {
  it('converts kebab-case to PascalCase', () => {
    expect(lucideExportName('alert-triangle')).toBe('AlertTriangle');
  });

  it('converts multi-part kebab-case', () => {
    expect(lucideExportName('battery-charging')).toBe('BatteryCharging');
  });

  it('handles kebab with digit', () => {
    expect(lucideExportName('building-2')).toBe('Building2');
  });

  it('capitalises single lowercase word', () => {
    expect(lucideExportName('activity')).toBe('Activity');
  });

  it('capitalises single lowercase word (bell)', () => {
    expect(lucideExportName('bell')).toBe('Bell');
  });

  it('passes through already-PascalCase name unchanged', () => {
    expect(lucideExportName('AlertTriangle')).toBe('AlertTriangle');
  });

  it('passes through single uppercase letter', () => {
    expect(lucideExportName('X')).toBe('X');
  });

  it('returns empty string for empty input', () => {
    expect(lucideExportName('')).toBe('');
  });
});

// ---------------------------------------------------------------------------
// generateIconManifest — integration tests
// ---------------------------------------------------------------------------

describe('generateIconManifest — kebab-case and lowercase YAML names', () => {
  let contentOutDir: string;
  let projectRoot: string;

  beforeEach(() => {
    contentOutDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sw-icons-content-'));
    projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'sw-icons-root-'));
  });

  function writeContentJson(data: unknown): void {
    fs.writeFileSync(path.join(contentOutDir, 'content.json'), JSON.stringify(data), 'utf8');
  }

  function readGeneratedIcons(): string {
    return fs.readFileSync(path.join(projectRoot, 'stackwright-generated', 'icons.ts'), 'utf8');
  }

  it('emits PascalCase import identifiers for kebab-case YAML icons', () => {
    writeContentJson({ icon: 'alert-triangle' });
    generateIconManifest(contentOutDir, projectRoot);
    const icons = readGeneratedIcons();
    // Import statement must use PascalCase — no raw hyphens in identifier position
    expect(icons).toMatch(/import \{[^}]*AlertTriangle[^}]*\} from 'lucide-react'/);
    // Raw kebab-case must NOT appear in the import identifier position
    expect(icons).not.toMatch(/import \{[^}]*alert-triangle[^}]*\}/);
  });

  it('emits PascalCase import identifier for lowercase single-word YAML icon', () => {
    writeContentJson({ icon: 'activity' });
    generateIconManifest(contentOutDir, projectRoot);
    const icons = readGeneratedIcons();
    expect(icons).toMatch(/import \{[^}]*Activity[^}]*\} from 'lucide-react'/);
    // Lowercase 'activity' must not appear as an import identifier
    expect(icons).not.toMatch(/import \{[^}]*\bactivity\b[^}]*\}/);
  });

  it('emits string-keyed entries in siteIconPreset for kebab-case and lowercase icons', () => {
    writeContentJson([{ icon: 'alert-triangle' }, { icon: 'activity' }]);
    generateIconManifest(contentOutDir, projectRoot);
    const icons = readGeneratedIcons();
    // Runtime registry must use original YAML key so lookup by name works
    expect(icons).toContain("'alert-triangle': AlertTriangle");
    expect(icons).toContain("'activity': Activity");
  });

  it('MUI alias precedence: "Speed" YAML name maps to Zap (not Speed)', () => {
    writeContentJson({ icon: 'Speed' });
    generateIconManifest(contentOutDir, projectRoot);
    const icons = readGeneratedIcons();
    // MUI alias wins — import should be Zap, not Speed
    expect(icons).toMatch(/import \{[^}]*Zap[^}]*\} from 'lucide-react'/);
    expect(icons).not.toMatch(/import \{[^}]*\bSpeed\b[^}]*\} from 'lucide-react'/);
    // Registry entry maps legacy YAML key to resolved export
    expect(icons).toContain("'Speed': Zap");
  });

  it('PascalCase YAML names that are NOT MUI aliases pass through unchanged', () => {
    writeContentJson({ icon: 'Truck' });
    generateIconManifest(contentOutDir, projectRoot);
    const icons = readGeneratedIcons();
    expect(icons).toMatch(/import \{[^}]*Truck[^}]*\} from 'lucide-react'/);
    // Short-form entry (no string key) since yamlName === lucideName
    expect(icons).toContain('  Truck,');
  });

  it('generates a valid import line with no hyphens in identifier positions for mixed input', () => {
    writeContentJson([
      { icon: 'alert-triangle' },
      { icon: 'battery-charging' },
      { icon: 'activity' },
      { icon: 'bell' },
      { icon: 'Truck' },
    ]);
    generateIconManifest(contentOutDir, projectRoot);
    const icons = readGeneratedIcons();
    // Extract the import { ... } line
    const importMatch = icons.match(/^import \{([^}]+)\} from 'lucide-react';/m);
    expect(importMatch).not.toBeNull();
    const importList = importMatch![1];
    // Every token in the import list must be a valid TS identifier (letters/digits only, no hyphens)
    const tokens = importList
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    for (const token of tokens) {
      expect(token).toMatch(/^[A-Za-z][A-Za-z0-9]*$/);
    }
  });
});

// ---------------------------------------------------------------------------
// isValidLucideExport — unit tests (swp-4uwg)
// ---------------------------------------------------------------------------

describe('isValidLucideExport', () => {
  it('returns true for a well-known canonical export', () => {
    expect(isValidLucideExport('Truck')).toBe(true);
  });

  it('returns true for AlertTriangle (deprecated alias — still exported)', () => {
    // lucide-react re-exports AlertTriangle as an alias for TriangleAlert.
    // The allow-list includes aliases, so this must be valid.
    expect(isValidLucideExport('AlertTriangle')).toBe(true);
  });

  it('returns true for HelpCircle (deprecated alias for CircleQuestionMark)', () => {
    expect(isValidLucideExport('HelpCircle')).toBe(true);
  });

  it('returns false for Bridge (never existed in lucide-react)', () => {
    expect(isValidLucideExport('Bridge')).toBe(false);
  });

  it('returns false for a lowercase icon name (allow-list is PascalCase)', () => {
    expect(isValidLucideExport('truck')).toBe(false);
  });

  it('returns false for a kebab-case icon name', () => {
    expect(isValidLucideExport('alert-triangle')).toBe(false);
  });

  it('returns false for an empty string', () => {
    expect(isValidLucideExport('')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// mapToValidLucideName — unit tests (swp-4uwg)
// ---------------------------------------------------------------------------

describe('mapToValidLucideName', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('passes through a valid PascalCase name unchanged', () => {
    expect(mapToValidLucideName('Truck')).toBe('Truck');
  });

  it('normalises kebab-case to PascalCase when the result is valid', () => {
    expect(mapToValidLucideName('alert-triangle')).toBe('AlertTriangle');
  });

  it('normalises lowercase single-word when the result is valid', () => {
    expect(mapToValidLucideName('activity')).toBe('Activity');
  });

  it('returns HelpCircle and warns for a completely unknown icon (Bridge → Bridge)', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const result = mapToValidLucideName('bridge');
    expect(result).toBe('HelpCircle');
    expect(warnSpy).toHaveBeenCalledOnce();
    // Warning should mention the original YAML name and the fallback
    expect(warnSpy.mock.calls[0][0]).toContain('bridge');
    expect(warnSpy.mock.calls[0][0]).toContain('HelpCircle');
  });

  it('returns HelpCircle for a capitalised-but-nonexistent icon (Bridge)', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(mapToValidLucideName('Bridge')).toBe('HelpCircle');
  });

  it('applies MUI alias before validation: Speed → Zap (not Speed)', () => {
    // Speed is a legacy MUI alias → Zap; Zap is a valid lucide export
    expect(mapToValidLucideName('Speed')).toBe('Zap');
  });
});

// ---------------------------------------------------------------------------
// generateIconManifest — unknown icon fallback tests (swp-4uwg integration guards)
// ---------------------------------------------------------------------------

describe('generateIconManifest — unknown icon fallback (swp-4uwg)', () => {
  let contentOutDir: string;
  let projectRoot: string;

  beforeEach(() => {
    contentOutDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sw-icons-fallback-'));
    projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'sw-icons-root-fallback-'));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  function writeContentJson(data: unknown): void {
    fs.writeFileSync(path.join(contentOutDir, 'content.json'), JSON.stringify(data), 'utf8');
  }

  function readGeneratedIcons(): string {
    return fs.readFileSync(path.join(projectRoot, 'stackwright-generated', 'icons.ts'), 'utf8');
  }

  it('falls back to HelpCircle for an unknown icon (bridge) and emits a warning', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    writeContentJson({ icon: 'bridge' });
    generateIconManifest(contentOutDir, projectRoot);
    const icons = readGeneratedIcons();
    // Must import HelpCircle, NOT Bridge
    expect(icons).toMatch(/import \{[^}]*HelpCircle[^}]*\} from 'lucide-react'/);
    expect(icons).not.toMatch(/import \{[^}]*\bBridge\b[^}]*\} from 'lucide-react'/);
    // Original YAML key preserved in preset so runtime lookup still works
    expect(icons).toContain("'bridge': HelpCircle");
    // Warning emitted
    const warnCalls = warnSpy.mock.calls.map((c) => c[0] as string);
    expect(warnCalls.some((msg) => msg.includes('bridge'))).toBe(true);
  });

  it('generated icons.ts parses as syntactically valid TypeScript (no hyphens in import identifiers)', () => {
    writeContentJson([{ icon: 'bridge' }, { icon: 'Truck' }, { icon: 'alert-triangle' }]);
    generateIconManifest(contentOutDir, projectRoot);
    const icons = readGeneratedIcons();
    // Extract import tokens and verify no hyphens
    const importMatch = icons.match(/^import \{([^}]+)\} from 'lucide-react';/m);
    expect(importMatch).not.toBeNull();
    const tokens = importMatch![1]
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    for (const token of tokens) {
      expect(token).toMatch(/^[A-Za-z][A-Za-z0-9]*$/);
    }
  });

  it('idempotent: running generateIconManifest twice produces byte-identical output', () => {
    writeContentJson([{ icon: 'bridge' }, { icon: 'Truck' }, { icon: 'alert-triangle' }]);
    generateIconManifest(contentOutDir, projectRoot);
    const first = readGeneratedIcons();
    generateIconManifest(contentOutDir, projectRoot);
    const second = readGeneratedIcons();
    expect(first).toBe(second);
  });

  it('valid icons alongside unknown icons produce correct imports for all', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    writeContentJson([{ icon: 'bridge' }, { icon: 'Truck' }, { icon: 'Users' }]);
    generateIconManifest(contentOutDir, projectRoot);
    const icons = readGeneratedIcons();
    // Valid icons must still be imported
    expect(icons).toMatch(/import \{[^}]*Truck[^}]*\} from 'lucide-react'/);
    expect(icons).toMatch(/import \{[^}]*Users[^}]*\} from 'lucide-react'/);
    // HelpCircle fallback is imported for 'bridge'
    expect(icons).toMatch(/import \{[^}]*HelpCircle[^}]*\} from 'lucide-react'/);
    // 'bridge' key maps to HelpCircle in preset
    expect(icons).toContain("'bridge': HelpCircle");
    // Truck and Users map to themselves (shorthand)
    expect(icons).toContain('  Truck,');
    expect(icons).toContain('  Users,');
  });
});
