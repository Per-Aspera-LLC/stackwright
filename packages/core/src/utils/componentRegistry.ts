import { ComponentType } from 'react';
import { Carousel } from '../components/narrative/Carousel/Carousel';
import { MainContentGrid, TabbedContentGrid } from '../components/base/';
import { Media } from '../components/media/Media'
import { Timeline } from '../components/narrative/Timeline';
import { stackwrightRegistry, getStackwrightImage, getStackwrightLink, getStackwrightRouter, getStackwrightRoute } from './stackwrightComponentRegistry';

// Component registry mapping yamlKey to component
export const componentRegistry: Record<string, ComponentType<any> | (() => ComponentType<any>)> = {
  carousel: Carousel,
  main: MainContentGrid,
  tabbed_content: TabbedContentGrid,
  media: Media,
  timeline: Timeline,
  // Stackwright components (will be resolved dynamically)
  'stackwright-image': () => getStackwrightImage(),
  'stackwright-link': () => getStackwrightLink(),
  'stackwright-router': () => getStackwrightRouter(),
  'stackwright-route': () => getStackwrightRoute(),
};

// Debug logging utility for component registry
const debugLogRegistry = (message: string, data?: any) => {
  if (process.env.NODE_ENV === 'development' && process.env.STACKWRIGHT_DEBUG === 'true') {
    console.log(`🔧 ComponentRegistry Debug: ${message}`, data ? data : '');
  }
};

// Helper to get component by content type
export function getComponentByType(contentType: string): ComponentType<any> | null {
  debugLogRegistry(`Looking up component for: ${contentType}`);
  debugLogRegistry('Available component types:', Object.keys(componentRegistry));
  
  const component = componentRegistry[contentType];
  debugLogRegistry(`Raw component lookup result:`, {
    found: !!component,
    type: typeof component,
    name: component?.name,
    constructor: component?.constructor?.name
  });
  
  if (!component) {
    debugLogRegistry(`No component found for: ${contentType}`);
    return null;
  }
  
  // Handle stackwright components that need dynamic resolution
  if (contentType.startsWith('stackwright-')) {
    debugLogRegistry(`Resolving stackwright component: ${contentType}`);
    // These are factory functions that return ComponentTypes
    const factory = component as () => ComponentType<any>;
    try {
      const resolvedComponent = factory();
      debugLogRegistry(`Stackwright component resolved:`, {
        type: typeof resolvedComponent,
        name: resolvedComponent?.name,
        constructor: resolvedComponent?.constructor?.name
      });
      return resolvedComponent;
    } catch (error) {
      debugLogRegistry(`Failed to resolve stackwright component '${contentType}':`, error);
      console.error(`Failed to resolve stackwright component '${contentType}':`, error);
      return null;
    }
  }
  
  // Return the component directly if it's already a ComponentType
  const finalComponent = component as ComponentType<any>;
  debugLogRegistry(`Returning standard component:`, {
    type: typeof finalComponent,
    name: finalComponent?.name,
    constructor: finalComponent?.constructor?.name
  });
  return finalComponent;
}

// Helper to register new components
export function registerComponent(contentType: string, component: ComponentType<any>) {
  componentRegistry[contentType] = component;
}

// Re-export stackwright registry for convenience
export { stackwrightRegistry, registerStackwrightComponents } from './stackwrightComponentRegistry';