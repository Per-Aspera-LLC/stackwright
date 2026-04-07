// Export the main content renderer
export * from './utils/contentRenderer';

// Export all base components
export * from './components/base';

// Export structural components
export * from './components/structural';

// Export Menu system (complete module)
export { CompressedMenu } from './components/base/Menu';

// Export narrative components
//export * from './components/narrative'
export { Carousel } from './components/narrative/Carousel/Carousel';

// Export configuration utilities (remove loadUserConfig)
export { mergeConfig, coreDefaults } from './config/defaults';
export { defaultSiteConfig } from './config/siteDefaults';
export type { StackwrightConfig } from './config/defaults';

// Export DynamicPage and SEO metadata resolution for CLI-generated sites
export { default as DynamicPage, resolvePageMeta } from './components/DynamicPage';

// Make sure PageLayout is exported
export { default as PageLayout } from './components/structural/PageLayout';

// Export safe theme hook
export { useSafeTheme } from './hooks/useSafeTheme';

// Export page utilities
export * from './pages/SlugPage';

// Stackwright component system exports
export * from './interfaces/stackwright-components';
export {
  stackwrightRegistry,
  registerStackwrightComponents,
  getStackwrightHead,
} from './utils/stackwrightComponentRegistry';
export {
  stackwrightUtilityRegistry,
  registerStackwrightUtilities,
} from './utils/stackwrightUtilityRegistry';
export { defaultStackwrightComponents } from './components/stackwright/DefaultStackwrightComponents';

// Content type extensibility
export {
  registerContentType,
  getRegisteredContentTypes,
  getContentTypeSchema,
} from './utils/contentTypeRegistry';
export type { ContentTypeEntry } from './utils/contentTypeRegistry';

// Collection provider registration
export {
  registerCollectionProvider,
  getCollectionProvider,
} from './utils/collectionProviderRegistry';

// Cookie & consent utilities
export { getCookie, setCookie, removeCookie } from './utils/cookies';
export type { CookieOptions } from './utils/cookies';
export { getConsentState, setConsentState, hasConsent } from './utils/consent';
export type { ConsentCategory, ConsentState } from './utils/consent';

// Map adapter system
export * from './map';
export { Map } from './components/content/Map';
export type {
  MapMarker,
  MapLayer,
  MapProviderProps,
  StackwrightMapProps,
} from './map/map-provider';
