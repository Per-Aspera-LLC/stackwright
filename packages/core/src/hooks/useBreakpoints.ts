import { useState, useEffect } from 'react';
import { useSiteConfig } from './useSiteConfig';

/**
 * SSR-safe matchMedia hook. Returns false during SSR / first render,
 * then syncs with the real media query.
 */
function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia(query);
    setMatches(mql.matches);
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, [query]);

  return matches;
}

// Default breakpoints matching standard values
const DEFAULT_BREAKPOINTS = {
  xs: "(max-width:599px)",
  sm: "(min-width:600px) and (max-width:899px)", 
  md: "(min-width:900px) and (max-width:1199px)",
  lg: "(min-width:1200px) and (max-width:1535px)",
  xl: "(min-width:1536px)"
};

/**
 * Hook to get responsive breakpoint utilities
 * Uses site configuration breakpoints with fallback to defaults
 */
export function useBreakpoints() {
  const siteConfig = useSiteConfig();
  const breakpoints = siteConfig?.breakpoints || DEFAULT_BREAKPOINTS;

  const isXs = useMediaQuery(breakpoints.xs);
  const isSm = useMediaQuery(breakpoints.sm);
  const isMd = useMediaQuery(breakpoints.md);
  const isLg = useMediaQuery(breakpoints.lg);
  const isXl = useMediaQuery(breakpoints.xl);

  // Additional utility functions
  const isSmUp = useMediaQuery('(min-width:600px)');
  const isMdUp = useMediaQuery('(min-width:900px)');
  const isLgUp = useMediaQuery('(min-width:1200px)');
  const isXlUp = useMediaQuery('(min-width:1536px)');

  const isSmDown = useMediaQuery('(max-width:899px)');
  const isMdDown = useMediaQuery('(max-width:1199px)');
  const isLgDown = useMediaQuery('(max-width:1535px)');

  return {
    // Exact breakpoints
    isXs,
    isSm,
    isMd,
    isLg,
    isXl,
    
    // Up breakpoints (at breakpoint and above)
    isSmUp,
    isMdUp,
    isLgUp,
    isXlUp,
    
    // Down breakpoints (at breakpoint and below)
    isSmDown,
    isMdDown,
    isLgDown,
    
    // Raw breakpoint values for custom usage
    breakpoints
  };
}
