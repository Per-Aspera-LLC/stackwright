import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useReducedMotion } from '../../src/hooks/useReducedMotion';

function makeMql(matches: boolean) {
  const listeners: Array<(e: MediaQueryListEvent) => void> = [];
  return {
    matches,
    addEventListener: vi.fn((_: string, handler: (e: MediaQueryListEvent) => void) => {
      listeners.push(handler);
    }),
    removeEventListener: vi.fn((_: string, handler: (e: MediaQueryListEvent) => void) => {
      const idx = listeners.indexOf(handler);
      if (idx !== -1) listeners.splice(idx, 1);
    }),
    // Helper to fire a change event
    _fire(newMatches: boolean) {
      listeners.forEach((h) => h({ matches: newMatches } as MediaQueryListEvent));
    },
  };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('useReducedMotion', () => {
  it('returns false by default (SSR-safe)', () => {
    vi.spyOn(window, 'matchMedia').mockReturnValue(makeMql(false) as unknown as MediaQueryList);
    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(false);
  });

  it('returns true when prefers-reduced-motion: reduce is active', () => {
    vi.spyOn(window, 'matchMedia').mockReturnValue(makeMql(true) as unknown as MediaQueryList);
    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(true);
  });

  it('updates when the media query changes', () => {
    const mql = makeMql(false);
    vi.spyOn(window, 'matchMedia').mockReturnValue(mql as unknown as MediaQueryList);
    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(false);

    act(() => {
      mql._fire(true);
    });
    expect(result.current).toBe(true);

    act(() => {
      mql._fire(false);
    });
    expect(result.current).toBe(false);
  });

  it('removes the event listener on unmount', () => {
    const mql = makeMql(false);
    vi.spyOn(window, 'matchMedia').mockReturnValue(mql as unknown as MediaQueryList);
    const { unmount } = renderHook(() => useReducedMotion());
    expect(mql.addEventListener).toHaveBeenCalledTimes(1);
    unmount();
    expect(mql.removeEventListener).toHaveBeenCalledTimes(1);
  });
});
