import { StackwrightComponents, StackwrightComponentRegistry } from '../interfaces/stackwright-components';

class StackwrightComponentRegistryImpl implements StackwrightComponentRegistry {
  private components: Partial<StackwrightComponents> = {};

  register(components: Partial<StackwrightComponents>): void {
    this.components = { ...this.components, ...components };
  }

  get<K extends keyof StackwrightComponents>(componentName: K): StackwrightComponents[K] {
    const component = this.components[componentName];
    if (!component) {
      throw new Error(
        `Stackwright component '${String(componentName)}' is not registered. ` +
        `Please register it using stackwrightRegistry.register() before use.`
      );
    }
    return component as StackwrightComponents[K];
  }

  getAll(): StackwrightComponents {
    const requiredComponents: (keyof StackwrightComponents)[] = ['Image', 'Link', 'Router', 'Route', 'StaticGeneration'];
    
    for (const componentName of requiredComponents) {
      if (!this.components[componentName]) {
        throw new Error(
          `Required stackwright component '${componentName}' is not registered. ` +
          `Please register all required components before use.`
        );
      }
    }
    
    return this.components as StackwrightComponents;
  }

  isRegistered(componentName: keyof StackwrightComponents): boolean {
    return !!this.components[componentName];
  }

  // Debug helper
  getRegisteredComponents(): string[] {
    return Object.keys(this.components);
  }

  // Clear all registrations (useful for testing)
  clear(): void {
    this.components = {};
  }
}

// Singleton instance
export const stackwrightRegistry = new StackwrightComponentRegistryImpl();


// Convenience functions for easier access
export const getStackwrightImage = () => stackwrightRegistry.get('Image');
export const getStackwrightLink = () => stackwrightRegistry.get('Link');
export const getStackwrightRouter = () => stackwrightRegistry.get('Router');
export const getStackwrightRoute = () => stackwrightRegistry.get('Route');
export const getStackwrightStaticGeneration = () => stackwrightRegistry.get('StaticGeneration');

// Helper to register components with validation
export function registerStackwrightComponents(components: Partial<StackwrightComponents>) {
  stackwrightRegistry.register(components);
}
