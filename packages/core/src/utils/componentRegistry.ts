import { ComponentType } from 'react';
import { Carousel } from '../components/narrative/Carousel/Carousel';
import { MainContentGrid, TabbedContentGrid, Graphic, IconGrid } from '../components/base/';
import { CarouselContent, MainContent, TabbedContent, GraphicContent, IconGridContent, TimelineContent } from '../types/content';
import { Timeline } from '../components/narrative/Timeline';
import { stackwrightRegistry, getStackwrightImage, getStackwrightLink, getStackwrightRouter, getStackwrightRoute } from './stackwrightComponentRegistry';

// Component registry mapping yamlKey to component
export const componentRegistry: Record<string, ComponentType<any> | (() => ComponentType<any>)> = {
  carousel: Carousel,
  main: MainContentGrid,
  tabbed_content: TabbedContentGrid,
  graphic: Graphic,
  icon_grid: IconGrid,
  timeline: Timeline,
  // Stackwright components (will be resolved dynamically)
  'stackwright-image': () => getStackwrightImage(),
  'stackwright-link': () => getStackwrightLink(),
  'stackwright-router': () => getStackwrightRouter(),
  'stackwright-route': () => getStackwrightRoute(),
};

// Helper to get component by content type
export function getComponentByType(contentType: string): ComponentType<any> | null {
  const component = componentRegistry[contentType];
  
  if (!component) {
    return null;
  }
  
  // Handle stackwright components that need dynamic resolution
  if (contentType.startsWith('stackwright-')) {
    // These are factory functions that return ComponentTypes
    const factory = component as () => ComponentType<any>;
    try {
      return factory();
    } catch (error) {
      console.error(`Failed to resolve stackwright component '${contentType}':`, error);
      return null;
    }
  }
  
  // Return the component directly if it's already a ComponentType
  return component as ComponentType<any>;
}

// Helper to register new components
export function registerComponent(contentType: string, component: ComponentType<any>) {
  componentRegistry[contentType] = component;
}

// Re-export stackwright registry for convenience
export { stackwrightRegistry, registerStackwrightComponents } from './stackwrightComponentRegistry';
