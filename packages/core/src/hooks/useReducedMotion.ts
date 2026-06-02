import { useState, useEffect } from 'react';

/**
 * SSR-safe hook that returns true when the user has requested reduced motion
 * via the OS/browser prefers-reduced-motion media feature.
 *
 * Returns false during SSR / first render (safe default — no motion suppression
 * on the server), then syncs with the real media query on the client.
 */
export function useReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mql.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  return prefersReducedMotion;
}
