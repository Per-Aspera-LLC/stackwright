import { stackwrightIconRegistry } from '../registry/iconRegistry';

export function useStackwrightIcon(name: string) {
  return {
    IconComponent: stackwrightIconRegistry.get(name),
    isRegistered: stackwrightIconRegistry.isRegistered(name),
    allRegisteredIcons: stackwrightIconRegistry.getRegisteredIcons()
  };
}