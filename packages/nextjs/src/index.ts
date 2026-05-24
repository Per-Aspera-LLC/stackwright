import { registerStackwrightComponents } from '@stackwright/core';

export { NextStackwrightImage } from './components/NextStackwrightImage';
export { NextStackwrightLink } from './components/NextStackwrightLink';
export { NextStackwrightRouter, NextStackwrightRoute } from './components/NextStackwrightRouter';
export { NextStackwrightHead } from './components/NextStackwrightHead';
export { StackwrightDocument } from './components/StackwrightDocument';
export {
  createStackwrightNextConfig,
  createSecurityHeadersConfig,
  headers,
} from './config/NextStackwrightConfig';
export {
  defaultSecurityHeaders,
  buildSecurityHeaders,
  type SecurityHeadersOptions,
  type SecurityHeader,
} from './config/security';

// App Router components
export { StackwrightLayout } from './components/StackwrightLayout';

// App Router static generation helpers (replaces getStaticProps/getStaticPaths)
export {
  generateStackwrightStaticParams,
  getStackwrightPageData,
  getStackwrightSiteConfig,
} from './static-generation';

import { NextStackwrightImage } from './components/NextStackwrightImage';
import { NextStackwrightLink } from './components/NextStackwrightLink';
import { NextStackwrightRouter, NextStackwrightRoute } from './components/NextStackwrightRouter';
import { NextStackwrightHead } from './components/NextStackwrightHead';

export function registerNextJSComponents() {
  registerStackwrightComponents({
    Image: NextStackwrightImage,
    Link: NextStackwrightLink,
    Router: NextStackwrightRouter,
    Route: NextStackwrightRoute,
    Head: NextStackwrightHead,
  });
}

export const nextJSStackwrightComponents = {
  Image: NextStackwrightImage,
  Link: NextStackwrightLink,
  Router: NextStackwrightRouter,
  Route: NextStackwrightRoute,
  Head: NextStackwrightHead,
};
