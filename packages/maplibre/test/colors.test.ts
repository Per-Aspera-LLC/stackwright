import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  toCssColor,
  resolveTokenColor,
  describeColorError,
  MapLibreColorError,
} from '../src/colors';

describe('toCssColor (markers — cheap path, never throws)', () => {
  it('passes literal hex/rgb/named colors through unchanged', () => {
    expect(toCssColor('#ef4444')).toBe('#ef4444');
    expect(toCssColor('#fff')).toBe('#fff');
    expect(toCssColor('rgba(0, 0, 0, 0.5)')).toBe('rgba(0, 0, 0, 0.5)');
    expect(toCssColor('red')).toBe('red');
    expect(toCssColor('transparent')).toBe('transparent');
  });

  it('passes an existing var() reference through unchanged', () => {
    expect(toCssColor('var(--sw-color-primary)')).toBe('var(--sw-color-primary)');
    expect(toCssColor('var(--sw-color-primary, #000)')).toBe('var(--sw-color-primary, #000)');
  });

  it('maps a bare token to var(--sw-color-<kebab>)', () => {
    expect(toCssColor('status-ok')).toBe('var(--sw-color-status-ok)');
    expect(toCssColor('brandPrimary')).toBe('var(--sw-color-brand-primary)');
    expect(toCssColor('primary')).toBe('var(--sw-color-primary)');
  });

  it('maps an already-prefixed bare token (sw-color-*) to var(--<token>)', () => {
    expect(toCssColor('sw-color-status-ok')).toBe('var(--sw-color-status-ok)');
  });

  it('passes undefined through and treats empty string as-is (caller applies its own default)', () => {
    expect(toCssColor(undefined)).toBeUndefined();
    expect(toCssColor('')).toBe('');
  });

  it('never throws for any input', () => {
    expect(() => toCssColor('!!!not-a-thing///')).not.toThrow();
  });
});

describe('resolveTokenColor (layers — getComputedStyle resolution)', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  function stubComputedStyle(values: Record<string, string>) {
    vi.spyOn(window, 'getComputedStyle').mockImplementation(
      () =>
        ({
          getPropertyValue: (name: string) => values[name] ?? '',
        }) as CSSStyleDeclaration
    );
  }

  it('passes literal colors through without touching getComputedStyle', () => {
    const spy = vi.spyOn(window, 'getComputedStyle');
    expect(resolveTokenColor('#3388ff')).toBe('#3388ff');
    expect(resolveTokenColor('rgb(1, 2, 3)')).toBe('rgb(1, 2, 3)');
    expect(spy).not.toHaveBeenCalled();
  });

  it('resolves a bare token via --sw-color-<kebab>', () => {
    stubComputedStyle({ '--sw-color-status-ok': '#16a34a' });
    expect(resolveTokenColor('status-ok')).toBe('#16a34a');
  });

  it('resolves an already-prefixed bare token', () => {
    stubComputedStyle({ '--sw-color-brand-primary': '#2563eb' });
    expect(resolveTokenColor('sw-color-brand-primary')).toBe('#2563eb');
  });

  it('resolves var(--x) via getComputedStyle', () => {
    stubComputedStyle({ '--sw-color-primary': '#0d9488' });
    expect(resolveTokenColor('var(--sw-color-primary)')).toBe('#0d9488');
  });

  it('falls back to var()s inline fallback when the property is unset', () => {
    stubComputedStyle({});
    expect(resolveTokenColor('var(--sw-color-missing, #f59e0b)')).toBe('#f59e0b');
  });

  it('uses opts.fallback instead of throwing when given', () => {
    stubComputedStyle({});
    expect(resolveTokenColor('status-ok', { fallback: '#64748b' })).toBe('#64748b');
  });

  it('reads against a specific element when opts.el is given', () => {
    const values: Record<string, string> = { '--sw-color-status-ok': '#16a34a' };
    const spy = vi
      .spyOn(window, 'getComputedStyle')
      .mockImplementation(
        () => ({ getPropertyValue: (name: string) => values[name] ?? '' }) as CSSStyleDeclaration
      );
    const el = document.createElement('div');
    resolveTokenColor('status-ok', { el });
    expect(spy).toHaveBeenCalledWith(el);
  });

  it('unresolvable token throws MapLibreColorError naming the token (no fallback given)', () => {
    stubComputedStyle({});
    expect(() => resolveTokenColor('status-ok', { context: 'layer test' })).toThrow(
      MapLibreColorError
    );
    try {
      resolveTokenColor('status-ok', { context: 'layer test' });
    } catch (err) {
      expect(err).toBeInstanceOf(MapLibreColorError);
      expect((err as MapLibreColorError).token).toBe('--sw-color-status-ok');
      expect((err as Error).message).toContain('layer test');
    }
  });
});

describe('describeColorError', () => {
  it('formats a MapLibreColorError with the token name', () => {
    const err = new MapLibreColorError('--sw-color-status-ok', 'layer polygon-0 fillColor');
    expect(describeColorError('layer polygon-0 fillColor', err)).toBe(
      'layer polygon-0 fillColor: unresolved color token --sw-color-status-ok'
    );
  });

  it('formats a plain Error via its message', () => {
    expect(describeColorError('ctx', new Error('boom'))).toBe('ctx: boom');
  });

  it('formats a non-Error thrown value via String()', () => {
    expect(describeColorError('ctx', 'oops')).toBe('ctx: oops');
  });
});
