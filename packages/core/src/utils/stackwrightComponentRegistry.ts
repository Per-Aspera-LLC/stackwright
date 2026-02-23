import { StackwrightComponents, StackwrightComponentRegistry } from '../interfaces/stackwright-components';

class StackwrightComponentRegistryImpl implements StackwrightComponentRegistry {
  private components: Partial<StackwrightComponents> = {};

  register(components: Partial<StackwrightComponents>): void {
    debugLogStackwright('Registering components:', Object.keys(components));
    
    for (const [key, component] of Object.entries(components)) {
      debugLogStackwright(`Registering ${key}:`, {
        type: typeof component,
        name: component?.name,
        constructor: component?.constructor?.name,
        isFunction: typeof component === 'function',
        isObject: typeof component === 'object',
        keys: typeof component === 'object' && component !== null ? Object.keys(component) : 'N/A',
        hasDefault: typeof component === 'object' && component !== null && 'default' in component
      });
    }
    
    this.components = { ...this.components, ...components };
    debugLogStackwright('All registered components after registration:', Object.keys(this.components));
  }

  get<K extends keyof StackwrightComponents>(componentName: K): StackwrightComponents[K] {
    debugLogStackwright(`Registry get called for: ${String(componentName)}`);
    debugLogStackwright('Current registered components:', Object.keys(this.components));
    
    const component = this.components[componentName];
    debugLogStackwright(`Component lookup result for ${String(componentName)}:`, {
      found: !!component,
      type: typeof component,
      name: component?.name,
      constructor: component?.constructor?.name
    });
    
    if (!component) {
      debugLogStackwright(`Component not found: ${String(componentName)}`);
      throw new Error(
        `Stackwright component '${String(componentName)}' is not registered. ` +
        `Please register it using stackwrightRegistry.register() before use.`
      );
    }
    return component as StackwrightComponents[K];
  }

  getAll(): StackwrightComponents {
    const requiredComponents: (keyof StackwrightComponents)[] = ['Image', 'Link', 'Router', 'Route'];
    
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


// Debug logging utility for stackwright registry
const debugLogStackwright = (message: string, data?: any) => {
  if (process.env.NODE_ENV === 'development' && process.env.STACKWRIGHT_DEBUG === 'true') {
    console.log(`🚀 StackwrightRegistry Debug: ${message}`, data ? data : '');
  }
};

// Convenience functions for easier access
export const getStackwrightImage = () => {
  debugLogStackwright('Getting Image component');
  debugLogStackwright('Registered components:', stackwrightRegistry.getRegisteredComponents());
  
  try {
    const imageComponent = stackwrightRegistry.get('Image');
    debugLogStackwright('Retrieved Image component:', {
      type: typeof imageComponent,
      name: imageComponent?.name,
      constructor: imageComponent?.constructor?.name,
      isFunction: typeof imageComponent === 'function',
      isObject: typeof imageComponent === 'object',
      keys: typeof imageComponent === 'object' && imageComponent !== null ? Object.keys(imageComponent) : 'N/A',
      hasDefault: typeof imageComponent === 'object' && imageComponent !== null && 'default' in imageComponent
    });
    return imageComponent;
  } catch (error) {
    debugLogStackwright('Error getting Image component:', error);
    throw error;
  }
};

export const getStackwrightLink = () => stackwrightRegistry.get('Link');
export const getStackwrightRouter = () => stackwrightRegistry.get('Router');
export const getStackwrightRoute = () => stackwrightRegistry.get('Route');

// Helper to register components with validation
export function registerStackwrightComponents(components: Partial<StackwrightComponents>) {
  stackwrightRegistry.register(components);
}