import { stackwrightUtilityRegistry } from '@stackwright/core';
import { registerStackwrightComponents } from '@stackwright/core';

export { NextStackwrightImage } from './components/NextStackwrightImage';
export { NextStackwrightLink } from './components/NextStackwrightLink';
export { NextStackwrightRouter, NextStackwrightRoute } from './components/NextStackwrightRouter';
export { NextStackwrightStaticGeneration } from './components/NextStackwrightStaticGeneration';

import { NextStackwrightImage } from './components/NextStackwrightImage';
import { NextStackwrightLink } from './components/NextStackwrightLink';
import { NextStackwrightRouter, NextStackwrightRoute } from './components/NextStackwrightRouter';
import { NextStackwrightStaticGeneration } from './components/NextStackwrightStaticGeneration';

export function registerNextJSComponents() {
  // Register components
  registerStackwrightComponents({
    Image: NextStackwrightImage,
    Link: NextStackwrightLink,
    Router: NextStackwrightRouter,
  Route: NextStackwrightRoute,
  });

  // Register utilities separately
  stackwrightUtilityRegistry.register({
    StaticGeneration: {
      getStaticProps: NextStackwrightStaticGeneration.getStaticProps,
      getStaticPaths: NextStackwrightStaticGeneration.getStaticPaths,
    }
  });
}

// Export the components as a set for manual registration
export const nextJSStackwrightComponents = {
  Image: NextStackwrightImage,
  Link: NextStackwrightLink,
  Router: NextStackwrightRouter,
  Route: NextStackwrightRoute,
};

// Auto-register components when this module is imported
registerNextJSComponents();
console.log('🔧 Stackwright Next.js components registered');
// Register utilities separately
stackwrightUtilityRegistry.register({
  StaticGeneration: {
    getStaticProps: NextStackwrightStaticGeneration.getStaticProps,
    getStaticPaths: NextStackwrightStaticGeneration.getStaticPaths,
  }
});
console.log('🔧 Stackwright Next.js utilities registered')