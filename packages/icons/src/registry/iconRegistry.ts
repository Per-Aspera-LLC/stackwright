import React from 'react';
import { SvgIconProps } from '@mui/material/SvgIcon';

// Define the IconComponent type
export type IconComponent = React.FC<SvgIconProps> | React.ComponentType<SvgIconProps>;

class StackwrightIconRegistryImpl {
  private icons: Map<string, IconComponent> = new Map();

  constructor() {
    // Make registry globally accessible for core package
    (globalThis as any).__stackwright_icon_registry__ = this;
  }

  register(name: string, component: IconComponent): void {
    this.icons.set(name, component);
  }

  get(name: string): IconComponent | undefined {
    return this.icons.get(name);
  }

  isRegistered(name: string): boolean {
    return this.icons.has(name);
  }

  getRegisteredIcons(): string[] {
    return Array.from(this.icons.keys());
  }

  clear(): void {
    this.icons.clear();
  }
}

export const stackwrightIconRegistry = new StackwrightIconRegistryImpl();

// Convenience functions
export function registerStackwrightIcon(name: string, component: IconComponent) {
  stackwrightIconRegistry.register(name, component);
}

export function registerStackwrightIcons(icons: Record<string, IconComponent>) {
  Object.entries(icons).forEach(([name, component]) => {
    stackwrightIconRegistry.register(name, component);
  });
}
