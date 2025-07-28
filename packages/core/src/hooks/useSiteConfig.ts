import { createContext, useContext } from 'react';
import { SiteConfig } from '../../../types/src/types/siteConfig';

// Create the context
const SiteConfigContext = createContext<SiteConfig | null>(null);

// Provider component (to be used in layout or app root)
export const SiteConfigProvider = SiteConfigContext.Provider;

/**
 * Hook to access site configuration
 * Returns null if no SiteConfigProvider is found
 */
export function useSiteConfig(): SiteConfig | null {
  return useContext(SiteConfigContext);
}

/**
 * Hook to access site configuration with fallback
 * Throws error if no SiteConfigProvider is found
 */
export function useSiteConfigRequired(): SiteConfig {
  const config = useContext(SiteConfigContext);
  if (!config) {
    throw new Error('useSiteConfigRequired must be used within a SiteConfigProvider');
  }
  return config;
}
