import { SiteConfig } from '../../../types/src/types/siteConfig';

/**
 * Default site configuration used across Stackwright
 */
export const defaultSiteConfig: SiteConfig = {
  title: 'Stackwright',
  themeName: 'corporate',
  appBar: {
    titleText: 'Stackwright Hello World',
  },
  navigation: [
    { label: 'Home', href: '/' },
    { label: 'About', href: '/about' },
    { label: 'Services', href: '/services' },
    { label: 'Contact', href: '/contact' },
  ],
  footer: {
    copyright: `© ${new Date().getFullYear()} Stackwright. All rights reserved.`,
  },
};
