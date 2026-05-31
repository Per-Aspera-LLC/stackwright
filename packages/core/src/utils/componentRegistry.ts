import React, { ComponentType } from 'react';

// Carousel is lazy-loaded so it is NOT in the first-load JS bundle.
// Pages that contain no carousel items never download the Carousel chunk.
const LazyCarousel = React.lazy(() =>
  import('../components/narrative/Carousel/Carousel').then((m) => ({ default: m.Carousel }))
) as ComponentType<any>;

// Map is lazy-loaded so it is NOT in the first-load JS bundle.
// Pages that contain no map items never download the Map chunk.
const LazyMap = React.lazy(() =>
  import('../components/base/Map').then((m) => ({ default: m.Map }))
) as ComponentType<any>;
import {
  MainContentGrid,
  TabbedContentGrid,
  TextBlockGrid,
  CodeBlock,
  IconGrid,
  FeatureList,
  TestimonialGrid,
  Faq,
  PricingTable,
  ContactFormStub,
  Form,
  Alert,
  LayoutGrid,
  CollectionList,
} from '../components/base/';
import { Media } from '../components/media/Media';
import { Timeline } from '../components/narrative/Timeline';
import NavSidebar from '../components/structural/NavSidebar';
import {
  getStackwrightImage,
  getStackwrightLink,
  getStackwrightRouter,
  getStackwrightRoute,
} from './stackwrightComponentRegistry';

// Component registry mapping YAML key → React component (or lazy factory for stackwright- prefixed)
export const componentRegistry: Record<string, ComponentType<any> | (() => ComponentType<any>)> = {
  carousel: LazyCarousel,
  main: MainContentGrid,
  tabbed_content: TabbedContentGrid,
  text_block: TextBlockGrid,
  media: Media,
  video: Media,
  timeline: Timeline,
  icon_grid: IconGrid,
  code_block: CodeBlock,
  feature_list: FeatureList,
  testimonial_grid: TestimonialGrid,
  faq: Faq,
  pricing_table: PricingTable,
  alert: Alert,
  contact_form_stub: ContactFormStub,
  form: Form,
  grid: LayoutGrid,
  collection_list: CollectionList,
  map: LazyMap,
  'nav-sidebar': NavSidebar,
  // Stackwright platform components (resolved dynamically via factory)
  'stackwright-image': () => getStackwrightImage(),
  'stackwright-link': () => getStackwrightLink(),
  'stackwright-router': () => getStackwrightRouter(),
  'stackwright-route': () => getStackwrightRoute(),
};

// Helper to get component by content type
export function getComponentByType(contentType: string): ComponentType<any> | null {
  const component = componentRegistry[contentType];

  if (!component) return null;

  // Stackwright platform components are registered as factories — resolve them
  if (contentType.startsWith('stackwright-')) {
    const factory = component as () => ComponentType<any>;
    try {
      return factory();
    } catch (error) {
      console.error(`[Stackwright] Failed to resolve component '${contentType}':`, error);
      return null;
    }
  }

  return component as ComponentType<any>;
}

// Helper to register new components
export function registerComponent(contentType: string, component: ComponentType<any>) {
  componentRegistry[contentType] = component;
}

// Helper to remove a component from the registry
export function deregisterComponent(contentType: string): void {
  delete componentRegistry[contentType];
}

// Re-export stackwright registry for convenience
export { stackwrightRegistry, registerStackwrightComponents } from './stackwrightComponentRegistry';
