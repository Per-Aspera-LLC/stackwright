import { describe, it, expect } from 'vitest';
import { collectIconSrcs } from '../src/prebuild';

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
