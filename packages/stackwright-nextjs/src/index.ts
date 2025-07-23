export { NextStackwrightImage } from './components/NextStackwrightImage';
export { NextStackwrightLink } from './components/NextStackwrightLink';
export { NextStackwrightRouter, NextStackwrightRoute } from './components/NextStackwrightRouter';

// Convenience function to register all Next.js components
import { registerStackwrightComponents } from '@stackwright/core';
import { NextStackwrightImage } from './components/NextStackwrightImage';
import { NextStackwrightLink } from './components/NextStackwrightLink';
import { NextStackwrightRouter, NextStackwrightRoute } from './components/NextStackwrightRouter';

export function registerNextJSComponents() {
  registerStackwrightComponents({
    Image: NextStackwrightImage,
    Link: NextStackwrightLink,
    Router: NextStackwrightRouter,
    Route: NextStackwrightRoute,
  });
}

// Export the components as a set for manual registration
export const nextJSStackwrightComponents = {
  Image: NextStackwrightImage,
  Link: NextStackwrightLink,
  Router: NextStackwrightRouter,
  Route: NextStackwrightRoute,
};
