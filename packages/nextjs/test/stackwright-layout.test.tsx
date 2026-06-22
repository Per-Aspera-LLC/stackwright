/**
 * Tests for StackwrightLayout reading `_theme.json` (swp-xyia).
 *
 * Verifies:
 * - defaultColorMode from _theme.json is passed as `fallback` to ColorModeScript
 * - Theme backgrounds are sourced from _theme.json when present
 * - Fallback to _site.json.customTheme when _theme.json is absent/empty
 * - No crash when neither file exists
 *
 * Implementation note: we use `vi.spyOn(fs, 'readFileSync')` rather than
 * `vi.mock('fs', ...)` because the component compiles to CJS and uses the
 * Node.js `fs` module as a CJS singleton. vi.spyOn patches the actual object
 * property, which is shared between the test and the component.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';
import fs from 'fs';

// ---------------------------------------------------------------------------
// ColorModeScript mock — capture the props it receives
// ---------------------------------------------------------------------------

const _cms = { props: null as Record<string, unknown> | null };

vi.mock('@stackwright/themes/color-mode-script', () => ({
  ColorModeScript: (props: Record<string, unknown>) => {
    _cms.props = props;
    return null;
  },
}));

// ---------------------------------------------------------------------------
// Import under test (after mocks)
// ---------------------------------------------------------------------------

import { StackwrightLayout } from '../src/components/StackwrightLayout';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Spy on `fs.readFileSync` for one test.
 * Returns content for files whose path contains the given keys;
 * throws ENOENT for all others.
 */
function spyReadFileSync(files: Record<string, string>) {
  return vi.spyOn(fs, 'readFileSync').mockImplementation((p: unknown) => {
    const strPath = String(p);
    for (const [key, content] of Object.entries(files)) {
      if (strPath.includes(key)) return content as unknown as Buffer;
    }
    const err = Object.assign(new Error(`ENOENT: ${strPath}`), { code: 'ENOENT' });
    throw err;
  });
}

function makeThemeJson(overrides: Record<string, unknown> = {}): string {
  return JSON.stringify({
    customTheme: {
      colors: { background: '#ffffff' },
      darkColors: { background: '#111111' },
    },
    defaultColorMode: 'system',
    ...overrides,
  });
}

function makeSiteJson(overrides: Record<string, unknown> = {}): string {
  return JSON.stringify({
    title: 'Test Site',
    customTheme: {
      colors: { background: '#aaaaaa' },
      darkColors: { background: '#333333' },
    },
    ...overrides,
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('StackwrightLayout — _theme.json integration (swp-xyia)', () => {
  beforeEach(() => {
    _cms.props = null;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('passes defaultColorMode="dark" from _theme.json as fallback to ColorModeScript', () => {
    spyReadFileSync({ '_theme.json': makeThemeJson({ defaultColorMode: 'dark' }) });

    render(
      <StackwrightLayout>
        <div>x</div>
      </StackwrightLayout>
    );

    expect(_cms.props?.fallback).toBe('dark');
  });

  it('passes defaultColorMode="light" from _theme.json as fallback', () => {
    spyReadFileSync({ '_theme.json': makeThemeJson({ defaultColorMode: 'light' }) });

    render(
      <StackwrightLayout>
        <div>x</div>
      </StackwrightLayout>
    );

    expect(_cms.props?.fallback).toBe('light');
  });

  it('defaults fallback to "system" when _theme.json has no defaultColorMode', () => {
    spyReadFileSync({
      '_theme.json': JSON.stringify({ customTheme: { colors: { background: '#fff' } } }),
    });

    render(
      <StackwrightLayout>
        <div>x</div>
      </StackwrightLayout>
    );

    expect(_cms.props?.fallback).toBe('system');
  });

  it('defaults fallback to "system" when _theme.json is absent', () => {
    spyReadFileSync({}); // all files → ENOENT

    render(
      <StackwrightLayout>
        <div>x</div>
      </StackwrightLayout>
    );

    expect(_cms.props?.fallback).toBe('system');
  });

  it('uses background colors from _theme.json for ColorModeScript', () => {
    spyReadFileSync({
      '_theme.json': JSON.stringify({
        defaultColorMode: 'dark',
        customTheme: {
          colors: { background: '#theme-light' },
          darkColors: { background: '#theme-dark' },
        },
      }),
    });

    render(
      <StackwrightLayout>
        <div>x</div>
      </StackwrightLayout>
    );

    expect(_cms.props?.lightBackground).toBe('#theme-light');
    expect(_cms.props?.darkBackground).toBe('#theme-dark');
  });

  it('falls back to _site.json customTheme backgrounds when _theme.json is absent', () => {
    spyReadFileSync({ '_site.json': makeSiteJson() }); // no _theme.json → ENOENT

    render(
      <StackwrightLayout>
        <div>x</div>
      </StackwrightLayout>
    );

    expect(_cms.props?.lightBackground).toBe('#aaaaaa');
    expect(_cms.props?.darkBackground).toBe('#333333');
    expect(_cms.props?.fallback).toBe('system'); // no _theme.json → default
  });

  it('falls back to _site.json backgrounds when _theme.json has no customTheme', () => {
    spyReadFileSync({
      '_theme.json': JSON.stringify({ defaultColorMode: 'dark' }), // no customTheme
      '_site.json': makeSiteJson(),
    });

    render(
      <StackwrightLayout>
        <div>x</div>
      </StackwrightLayout>
    );

    // defaultColorMode from _theme.json; backgrounds from _site.json fallback
    expect(_cms.props?.fallback).toBe('dark');
    expect(_cms.props?.lightBackground).toBe('#aaaaaa');
    expect(_cms.props?.darkBackground).toBe('#333333');
  });

  it('renders without crashing when no files exist', () => {
    spyReadFileSync({}); // all ENOENT

    const { baseElement } = render(
      <StackwrightLayout>
        <div>content</div>
      </StackwrightLayout>
    );

    expect(baseElement.textContent).toContain('content');
    expect(_cms.props?.fallback).toBe('system');
    expect(_cms.props?.lightBackground).toBeUndefined();
  });
});
