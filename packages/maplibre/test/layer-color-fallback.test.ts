import { describe, it, expect, vi, afterEach } from 'vitest';
import { resolveLayerColor } from '../src/MapLibreProvider';

/**
 * Covers the G7 pivot fix's "do NOT crash the map" contract for layers:
 * an unresolvable token falls back to a visible default and reports through
 * console.error + the caller's onError (which MapLibreProvider wires to the
 * error-strip overlay) — it never throws out of resolveLayerColor itself.
 */
describe('resolveLayerColor (layers — unresolvable token never crashes)', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns fallback and reports via console.error + onError when the token is unresolvable', () => {
    vi.spyOn(window, 'getComputedStyle').mockImplementation(
      () => ({ getPropertyValue: () => '' }) as unknown as CSSStyleDeclaration
    );
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const onError = vi.fn();

    let result: string | undefined;
    expect(() => {
      result = resolveLayerColor(
        'status-ok',
        '#3388ff',
        'layer polygon-0 style.fillColor',
        undefined,
        onError
      );
    }).not.toThrow();

    expect(result).toBe('#3388ff');
    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError).toHaveBeenCalledWith(
      expect.stringContaining('unresolved color token --sw-color-status-ok')
    );
    expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
    expect(consoleErrorSpy.mock.calls[0][0]).toContain('@stackwright/maplibre');
  });

  it('resolves and returns the literal value when the token IS defined (no error reported)', () => {
    vi.spyOn(window, 'getComputedStyle').mockImplementation(
      () =>
        ({
          getPropertyValue: (name: string) => (name === '--sw-color-status-ok' ? '#16a34a' : ''),
        }) as CSSStyleDeclaration
    );
    const onError = vi.fn();

    const result = resolveLayerColor('status-ok', '#3388ff', 'ctx', undefined, onError);

    expect(result).toBe('#16a34a');
    expect(onError).not.toHaveBeenCalled();
  });

  it('returns the fallback directly (no getComputedStyle call, no error) when raw is undefined', () => {
    const spy = vi.spyOn(window, 'getComputedStyle');
    const onError = vi.fn();

    const result = resolveLayerColor(undefined, '#3388ff', 'ctx', undefined, onError);

    expect(result).toBe('#3388ff');
    expect(spy).not.toHaveBeenCalled();
    expect(onError).not.toHaveBeenCalled();
  });

  it('passes a literal color straight through without touching getComputedStyle', () => {
    const spy = vi.spyOn(window, 'getComputedStyle');
    const onError = vi.fn();

    const result = resolveLayerColor('#f59e0b', '#3388ff', 'ctx', undefined, onError);

    expect(result).toBe('#f59e0b');
    expect(spy).not.toHaveBeenCalled();
    expect(onError).not.toHaveBeenCalled();
  });
});
