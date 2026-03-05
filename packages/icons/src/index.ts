// Core system

export type { IconProps, IconComponent } from './registry/iconRegistry';
export {
  stackwrightIconRegistry,
  registerStackwrightIcon,
  registerStackwrightIcons
} from './registry/iconRegistry';

// Individual icons (tree-shakeable)
export { BlueSkyIcon } from './icons/social/BlueSkyIcon';
export { StackwrightIcon } from './icons/brand/StackwrightIcon';

// Convenient presets
export {
  defaultStackwrightIcons,
  registerDefaultIcons
} from './presets/defaultIcons';
export { lucideIconPreset, registerLucideIcons } from './presets/lucideIcons';

// Organized exports
export * from './icons/brand';
export * from './icons/social';
