// Export the main content renderer
export * from './utils/contentRenderer'

// Export types 
export * from './types/content'

// Export all base components
export * from './components/base'

// Export structural components
export * from './components/structural'

// Export Menu system (complete module)
export {CompressedMenu} from './components/base/Menu'

// Export narrative components
//export * from './components/narrative'
export { Carousel } from './components/narrative/Carousel/Carousel'

// Export configuration utilities (remove loadUserConfig)
export { mergeConfig, coreDefaults } from './config/defaults'
export { defaultSiteConfig } from './config/siteDefaults'
export type { StackwrightConfig } from './config/defaults'

// Export DynamicPage for CLI-generated sites
export { default as DynamicPage } from './components/DynamicPage'

// Add the new types to exports
export * from './types/siteConfig'

// Make sure PageLayout is exported
export { default as PageLayout } from './components/structural/PageLayout'

// Export safe theme hook
export { useSafeTheme } from './hooks/useSafeTheme'

// Export page utilities
export * from './pages/SlugPage'

// Stackwright component system exports
export * from './interfaces/stackwright-components'
export { stackwrightRegistry, registerStackwrightComponents } from './utils/stackwrightComponentRegistry'
export { defaultStackwrightComponents } from './components/stackwright/DefaultStackwrightComponents'