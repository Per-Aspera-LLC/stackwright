import { registerStackwrightComponents } from '@stackwright/core';

export { NextStackwrightImage } from './components/NextStackwrightImage';
export { NextStackwrightLink } from './components/NextStackwrightLink';
export { NextStackwrightRouter, NextStackwrightRoute } from './components/NextStackwrightRouter';
export { createStackwrightNextConfig } from './config/NextStackwrightConfig';

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

export const nextJSStackwrightComponents = {
  Image: NextStackwrightImage,
  Link: NextStackwrightLink,
  Router: NextStackwrightRouter,
  Route: NextStackwrightRoute,
};

